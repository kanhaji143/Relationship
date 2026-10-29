import { jsonError } from "@/lib/http/json";
import { getAdminDb } from "@/lib/firebase/admin/app";
import {
  COLLECTIONS,
  preferencesDoc,
  profileDoc,
  userDoc,
  userPrivateDoc,
} from "@/lib/firebase/collections";
import { ageFromBirthDate } from "@/lib/discovery/age";
import { buildCandidateFeed, type CandidateSource } from "@/lib/discovery/build-feed";
import { toDiscoveryParticipant } from "@/lib/discovery/participant";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit/fixed-window";
import { getSessionUser } from "@/lib/session";
import { MAX_AGE, MIN_AGE } from "@/lib/validation/auth";

/**
 * Returns eligible candidates for the signed-in user's discovery feed.
 * Excludes self, blocked users, inactive/hidden/unapproved profiles,
 * intent/age/region/language mismatches, and already-liked/passed users.
 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated");

  const uid = session.uid;
  const rateLimit = consumeRateLimit(`discover-candidates:${uid}`, {
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return jsonError(429, "rate_limited", {
      "retry-after": String(rateLimit.retryAfterSeconds),
    });
  }
  const db = getAdminDb();

  try {
    // Account state, profile and preferences are separate server-side documents.
    const [
      viewerUserSnap,
      viewerProfileSnap,
      viewerPrefsSnap,
      viewerAgeSnap,
      blocksOutSnap,
      blocksInSnap,
      likesSnap,
    ] = await Promise.all([
      db.doc(userDoc(uid)).get(),
      db.doc(profileDoc(uid)).get(),
      db.doc(preferencesDoc(uid)).get(),
      db.doc(userPrivateDoc(uid, "ageAssurance")).get(),
      db.collection(COLLECTIONS.blocks).where("blockerUid", "==", uid).get(),
      db.collection(COLLECTIONS.blocks).where("blockedUid", "==", uid).get(),
      db.collection(COLLECTIONS.likes).where("fromUid", "==", uid).get(),
    ]);

    if (!viewerUserSnap.exists || viewerUserSnap.get("accountStatus") !== "active") {
      return jsonError(403, "account_unavailable");
    }
    if (!viewerProfileSnap.exists || !viewerPrefsSnap.exists) {
      return jsonError(409, "onboarding_required");
    }
    const viewerProfile = viewerProfileSnap.data() ?? {};
    const viewerPrefs = viewerPrefsSnap.data() ?? {};
    const viewerAge = ageFromBirthDate(viewerAgeSnap.get("birthDate"));
    if (viewerAge === null) return jsonError(409, "profile_incomplete");
    if (viewerAge < MIN_AGE || viewerAge > MAX_AGE) {
      return jsonError(403, "adult_eligibility_required");
    }
    if (viewerPrefs.discoveryPaused === true) return Response.json({ candidates: [] });
    if (viewerProfile.moderationStatus !== "approved") {
      return Response.json(
        { error: "profile_review_required" },
        { status: 409, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (viewerProfile.visibility !== "visible") {
      return Response.json(
        { candidates: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    // Exclude both users blocked by the viewer and users who blocked the viewer.
    const blockedUids = new Set([
      ...blocksOutSnap.docs.map((d) => d.get("blockedUid") as string),
      ...blocksInSnap.docs.map((d) => d.get("blockerUid") as string),
    ]);
    const seenUids = new Set(likesSnap.docs.map((d) => d.get("toUid") as string));
    seenUids.add(uid);

    // Load all active profiles (limited for MVP; production uses pre-computed pools)
    const profilesSnap = await db
      .collection(COLLECTIONS.profiles)
      .where("visibility", "==", "visible")
      .where("moderationStatus", "==", "approved")
      .limit(50)
      .get();

    const profileDocs = profilesSnap.docs.filter(
      (doc) => !seenUids.has(doc.id) && !blockedUids.has(doc.id),
    );
    const candidateUids = profileDocs.map((doc) => doc.id);
    const candidateUserDocs =
      candidateUids.length > 0
        ? await db.getAll(...candidateUids.map((id) => db.doc(userDoc(id))))
        : [];
    const candidatePreferenceDocs =
      candidateUids.length > 0
        ? await db.getAll(...candidateUids.map((id) => db.doc(preferencesDoc(id))))
        : [];
    const candidateAgeDocs =
      candidateUids.length > 0
        ? await db.getAll(...candidateUids.map((id) => db.doc(userPrivateDoc(id, "ageAssurance"))))
        : [];

    const [viewerPromptsSnap, candidatePromptBatches] = await Promise.all([
      db.collection(COLLECTIONS.prompts).where("uid", "==", uid).get(),
      Promise.all(
        Array.from({ length: Math.ceil(candidateUids.length / 30) }, (_, batchIndex) => {
          const uidBatch = candidateUids.slice(batchIndex * 30, batchIndex * 30 + 30);
          return db.collection(COLLECTIONS.prompts).where("uid", "in", uidBatch).get();
        }),
      ),
    ]);

    const viewerPromptKeys = new Set(
      viewerPromptsSnap.docs
        .filter((doc) => doc.get("moderationStatus") === "approved")
        .map((doc) => doc.get("promptKey"))
        .filter((key): key is string => typeof key === "string"),
    );
    const candidatePromptKeys = new Map<string, Set<string>>();
    for (const promptsSnap of candidatePromptBatches) {
      for (const promptDoc of promptsSnap.docs) {
        if (promptDoc.get("moderationStatus") !== "approved") continue;
        const promptUid = promptDoc.get("uid") as string;
        const promptKey = promptDoc.get("promptKey");
        if (typeof promptKey !== "string") continue;
        const keys = candidatePromptKeys.get(promptUid) ?? new Set<string>();
        keys.add(promptKey);
        candidatePromptKeys.set(promptUid, keys);
      }
    }

    const viewerParticipant = toDiscoveryParticipant({
      uid,
      user: viewerUserSnap.data() ?? {},
      profile: viewerProfile,
      preferences: viewerPrefs,
      privateAge: { birthDate: viewerAgeSnap.get("birthDate") },
      blockedUids: [...blockedUids],
    });
    if (!viewerParticipant) return jsonError(409, "profile_incomplete");

    const candidateSources: CandidateSource[] = [];
    for (let index = 0; index < profileDocs.length; index += 1) {
      const doc = profileDocs[index]!;
      const data = doc.data();
      const candidateUid = doc.id;
      const accountData = candidateUserDocs[index]?.data();
      const candidatePrefs = candidatePreferenceDocs[index]?.data();
      const candidateAgeData = candidateAgeDocs[index]?.data();
      if (!accountData || !candidatePrefs) continue;

      const participant = toDiscoveryParticipant({
        uid: candidateUid,
        user: accountData,
        profile: data,
        preferences: candidatePrefs,
        privateAge: candidateAgeData ?? {},
        blockedUids: [],
      });
      if (!participant) continue;

      candidateSources.push({
        participant,
        displayName: typeof data.displayName === "string" ? data.displayName : "",
        bio: typeof data.bio === "string" ? data.bio : "",
        broadLocationLabel:
          typeof data.broadLocationLabel === "string" ? data.broadLocationLabel : "India",
        promptKeys: [...(candidatePromptKeys.get(candidateUid) ?? [])],
      });
    }

    const candidates = buildCandidateFeed(
      viewerParticipant,
      candidateSources,
      seenUids,
      viewerPromptKeys,
      Date.now(),
    );

    return Response.json(
      { candidates: candidates.slice(0, 10) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logger.error("discover.candidates_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(503, "discover_unavailable");
  }
}
