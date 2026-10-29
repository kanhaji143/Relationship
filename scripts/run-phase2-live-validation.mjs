#!/usr/bin/env node

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { applicationDefault, cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

const EXPECTED_PROJECT_ID = "apna-computer-ltd";
const SESSION_COOKIE = "__session";
const APP_URL = process.env.PHASE2_APP_URL ?? "http://127.0.0.1:3002";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const approved = process.argv.includes("--confirm-live-writes");

function requireLocalAppOrigin(value) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("PHASE2_APP_URL must point to a local development server.");
  }
  return url.origin;
}

function safeError(error) {
  return {
    name: error instanceof Error ? error.name : "unknown",
    code: typeof error?.code === "string" ? error.code : "unknown",
  };
}

async function exchangePasswordForIdToken(email, password) {
  const endpoint = new URL("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword");
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`auth_token_exchange_http_${response.status}`);

  const result = await response.json();
  if (typeof result.idToken !== "string") throw new Error("auth_id_token_missing");
  return result.idToken;
}

async function createSessionCookie(appOrigin, email, password) {
  const idToken = await exchangePasswordForIdToken(email, password);
  const response = await fetch(`${appOrigin}/api/auth/session`, {
    method: "POST",
    headers: {
      origin: appOrigin,
      "content-type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error(`session_exchange_http_${response.status}`);

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie") ?? ""];
  const value = setCookies
    .map((header) => new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`).exec(header)?.[1])
    .find((entry) => typeof entry === "string");
  if (!value) throw new Error("session_cookie_missing");
  return `${SESSION_COOKIE}=${value}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  let body = {};
  try {
    body = await response.json();
  } catch {
    // A non-JSON response is represented by its HTTP status only.
  }
  return { response, body };
}

async function main() {
  if (!approved) throw new Error("live_write_approval_required (--confirm-live-writes)");
  if (projectId !== EXPECTED_PROJECT_ID) throw new Error("firebase_project_guard_failed");
  if (!apiKey) throw new Error("firebase_web_api_key_missing");
  if (
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ||
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
  ) {
    throw new Error("emulator_environment_detected");
  }

  const appOrigin = requireLocalAppOrigin(APP_URL);
  const health = await fetch(appOrigin, { redirect: "manual" });
  if (health.status !== 200) throw new Error(`local_app_unavailable_http_${health.status}`);

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH?.trim();
  const credential = keyPath ? cert(keyPath) : applicationDefault();
  const adminApp = initializeApp(
    { credential, projectId },
    `phase2-live-validation-${randomUUID()}`,
  );
  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);

  const runId = randomUUID().replaceAll("-", "").slice(0, 12);
  const uidA = `0000phase2${runId}a`;
  const uidB = `0000phase2${runId}b`;
  const emailA = `bondora-phase2-${runId}-a@example.com`;
  const emailB = `bondora-phase2-${runId}-b@example.com`;
  const passwordA = `${randomBytes(36).toString("base64url")}aA1!`;
  const passwordB = `${randomBytes(36).toString("base64url")}bB2!`;
  const createdAuthUids = [];
  const fixturePaths = [];
  const checks = [];
  let auditRecordsRetained = 0;
  let cleanupFailures = 0;

  const matchId = `${[uidA, uidB].sort()[0]}_${[uidA, uidB].sort()[1]}`;
  const likeAtoB = `likes/${directionalLikeId(uidA, uidB)}`;
  const likeBtoA = `likes/${directionalLikeId(uidB, uidA)}`;
  const blockPath = `blocks/phase2-live-${runId}`;
  const matchPath = `matches/${matchId}`;
  const conversationPath = `conversations/${matchId}`;

  fixturePaths.push(likeAtoB, likeBtoA, blockPath, matchPath, conversationPath);

  try {
    for (const [uid, email, password, displayName] of [
      [uidA, emailA, passwordA, "Phase 2 Test A"],
      [uidB, emailB, passwordB, "Phase 2 Test B"],
    ]) {
      const user = await auth.createUser({
        uid,
        email,
        password,
        emailVerified: true,
        displayName,
      });
      createdAuthUids.push(user.uid);
      await seedParticipant(
        db,
        fixturePaths,
        uid,
        email,
        displayName,
        uid === uidA ? "1990-01-01" : "1992-01-01",
      );
    }
    checks.push("two temporary synthetic Auth users and test-only profile fixtures created");

    const cookieA = await createSessionCookie(appOrigin, emailA, passwordA);
    const cookieB = await createSessionCookie(appOrigin, emailB, passwordB);
    checks.push("both live Auth ID tokens exchanged for local HttpOnly session cookies");

    const candidates = await requestJson(`${appOrigin}/api/discover/candidates`, {
      headers: { cookie: cookieA },
    });
    if (candidates.response.status !== 200) {
      throw new Error(`candidate_feed_http_${candidates.response.status}`);
    }
    const candidate = candidates.body.candidates?.find((item) => item.uid === uidB);
    if (!candidate) throw new Error("approved_test_partner_missing_from_candidate_feed");
    if ("birthDate" in candidate || "privateAge" in candidate) {
      throw new Error("candidate_feed_private_age_leak");
    }
    checks.push("candidate feed returns the approved synthetic partner without exact DOB");

    await db.doc(blockPath).set({
      blockerUid: uidB,
      blockedUid: uidA,
      createdAt: FieldValue.serverTimestamp(),
    });
    const blockedAction = await requestJson(`${appOrigin}/api/discover/like`, {
      method: "POST",
      headers: { cookie: cookieA, origin: appOrigin, "content-type": "application/json" },
      body: JSON.stringify({ targetUid: uidB, action: "like" }),
    });
    if (blockedAction.response.status !== 404) throw new Error("blocked_like_was_not_rejected");
    const blockedFeed = await requestJson(`${appOrigin}/api/discover/candidates`, {
      headers: { cookie: cookieA },
    });
    if (blockedFeed.body.candidates?.some((item) => item.uid === uidB)) {
      throw new Error("blocked_partner_remained_in_candidate_feed");
    }
    await db.doc(blockPath).delete();
    checks.push("two-way block excluded the candidate and rejected the like");

    const firstLike = await requestJson(`${appOrigin}/api/discover/like`, {
      method: "POST",
      headers: { cookie: cookieA, origin: appOrigin, "content-type": "application/json" },
      body: JSON.stringify({ targetUid: uidB, action: "like" }),
    });
    if (firstLike.response.status !== 200 || firstLike.body.matched !== false) {
      throw new Error("first_like_failed");
    }

    const reciprocalLike = await requestJson(`${appOrigin}/api/discover/like`, {
      method: "POST",
      headers: { cookie: cookieB, origin: appOrigin, "content-type": "application/json" },
      body: JSON.stringify({ targetUid: uidA, action: "like" }),
    });
    if (reciprocalLike.response.status !== 200 || reciprocalLike.body.matched !== true) {
      throw new Error("reciprocal_like_failed");
    }

    const [match, conversation, audit] = await Promise.all([
      db.doc(matchPath).get(),
      db.doc(conversationPath).get(),
      db.collection("auditLogs").where("actorUid", "in", [uidA, uidB]).get(),
    ]);
    if (!match.exists || !conversation.exists || audit.size !== 2) {
      throw new Error("live_match_or_audit_records_missing");
    }

    const retry = await requestJson(`${appOrigin}/api/discover/like`, {
      method: "POST",
      headers: { cookie: cookieB, origin: appOrigin, "content-type": "application/json" },
      body: JSON.stringify({ targetUid: uidA, action: "like" }),
    });
    if (retry.response.status !== 200 || retry.body.status !== "already_recorded") {
      throw new Error("duplicate_retry_not_idempotent");
    }
    auditRecordsRetained = audit.size;
    checks.push(
      "mutual likes created one canonical match/conversation and two audit events; retry was idempotent",
    );

    console.log(JSON.stringify({ status: "PASS", projectId, checks }, null, 2));
  } finally {
    for (const path of [...new Set(fixturePaths)].reverse()) {
      try {
        await db.doc(path).delete();
      } catch {
        cleanupFailures += 1;
      }
    }

    for (const uid of createdAuthUids) {
      try {
        await auth.deleteUser(uid);
      } catch {
        cleanupFailures += 1;
      }
    }

    try {
      const retainedAudit = await db
        .collection("auditLogs")
        .where("actorUid", "in", [uidA, uidB])
        .get();
      auditRecordsRetained = Math.max(auditRecordsRetained, retainedAudit.size);
    } catch {
      cleanupFailures += 1;
    }

    console.log(
      JSON.stringify({
        cleanupFailures,
        temporaryAuthUsersDeleted: createdAuthUids.length,
        appendOnlyAuditRecordsRetained: auditRecordsRetained,
      }),
    );
    await deleteApp(adminApp);
    if (cleanupFailures > 0) process.exitCode = 1;
  }
}

function directionalLikeId(fromUid, toUid) {
  // The route's Firestore IDs are SHA-256 of the ordered UID pair.
  return createHash("sha256")
    .update(JSON.stringify([fromUid, toUid]))
    .digest("hex");
}

async function seedParticipant(db, fixturePaths, uid, email, displayName, birthDate) {
  const now = Timestamp.now();
  const documents = [
    [
      `users/${uid}`,
      {
        uid,
        emailNormalized: email.toLowerCase(),
        accountStatus: "active",
        role: "user",
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      },
    ],
    [
      `profiles/${uid}`,
      {
        uid,
        displayName,
        birthDate: null,
        pronouns: null,
        bio: "Fictional Phase 2 live-validation fixture.",
        countryCode: "IN",
        regionCode: "northeast",
        broadLocationLabel: "Northeast India",
        languages: ["en-IN"],
        visibility: "visible",
        moderationStatus: "approved",
        photoCount: 0,
        interestIds: ["books", "music", "travel"],
        createdAt: now,
        updatedAt: now,
      },
    ],
    [
      `preferences/${uid}`,
      {
        uid,
        intent: "serious",
        desiredIntents: ["serious"],
        ageMin: 25,
        ageMax: 40,
        distanceLimitKm: null,
        preferredRegions: ["northeast"],
        preferredLanguages: ["en-IN"],
        dealbreakers: [],
        discoveryPaused: false,
        updatedAt: now,
      },
    ],
    [
      `users/${uid}/private/ageAssurance`,
      {
        birthDate,
        ageAssurance: { method: "self_declared", status: "unverified", verifiedAt: null },
        updatedAt: now,
      },
    ],
  ];

  for (const [path, document] of documents) {
    fixturePaths.push(path);
    await db.doc(path).set(document);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "ERROR", ...safeError(error) }));
  process.exitCode = 1;
});
