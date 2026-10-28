import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { preferencesDoc, profileDoc, userPrivateDoc } from "@/lib/firebase/collections";
import { REGION_IDS, type RegionId } from "@/lib/config/onboarding";
import type { OnboardingDraft } from "@/features/onboarding/types";

export type ProfileSummary = {
  displayName: string;
  bio: string;
  broadLocationLabel: string;
  languages: string[];
  interestCount: number;
  intent: "serious" | "casual" | null;
  visibility: "visible" | "hidden";
  moderationStatus: string;
};

/** Private, owner-only values used to prefill the authenticated edit form. */
export async function getOnboardingDraft(uid: string): Promise<OnboardingDraft | null> {
  const db = getAdminDb();
  const [profileSnapshot, preferencesSnapshot, privateSnapshot] = await Promise.all([
    db.doc(profileDoc(uid)).get(),
    db.doc(preferencesDoc(uid)).get(),
    db.doc(userPrivateDoc(uid, "ageAssurance")).get(),
  ]);

  if (!profileSnapshot.exists) return null;
  const profile = profileSnapshot.data() ?? {};
  const preferences = preferencesSnapshot.data() ?? {};
  const privateData = privateSnapshot.data() ?? {};
  const rawRegion = profile.regionCode;

  return {
    displayName: typeof profile.displayName === "string" ? profile.displayName : "",
    birthDate: typeof privateData.birthDate === "string" ? privateData.birthDate : "",
    intent: preferences.intent === "casual" ? "casual" : "serious",
    region:
      typeof rawRegion === "string" && (REGION_IDS as readonly string[]).includes(rawRegion)
        ? (rawRegion as RegionId)
        : null,
    languages: Array.isArray(profile.languages)
      ? profile.languages.filter((value): value is string => typeof value === "string")
      : ["en-IN"],
    bio: typeof profile.bio === "string" ? profile.bio : "",
    interestIds: Array.isArray(profile.interestIds)
      ? profile.interestIds.filter((value): value is string => typeof value === "string")
      : [],
  };
}

/** Server-side profile read. Returns null until onboarding is complete. */
export async function getProfileSummary(uid: string): Promise<ProfileSummary | null> {
  const db = getAdminDb();
  const [profileSnapshot, preferencesSnapshot] = await Promise.all([
    db.doc(profileDoc(uid)).get(),
    db.doc(preferencesDoc(uid)).get(),
  ]);

  if (!profileSnapshot.exists) return null;

  const profile = profileSnapshot.data() ?? {};
  const preferences = preferencesSnapshot.data() ?? {};
  const intent = preferences.intent;

  return {
    displayName: typeof profile.displayName === "string" ? profile.displayName : "",
    bio: typeof profile.bio === "string" ? profile.bio : "",
    broadLocationLabel:
      typeof profile.broadLocationLabel === "string" ? profile.broadLocationLabel : "India",
    languages: Array.isArray(profile.languages)
      ? profile.languages.filter((value): value is string => typeof value === "string")
      : [],
    interestCount: Array.isArray(profile.interestIds) ? profile.interestIds.length : 0,
    intent: intent === "serious" || intent === "casual" ? intent : null,
    visibility: profile.visibility === "hidden" ? "hidden" : "visible",
    moderationStatus:
      typeof profile.moderationStatus === "string" ? profile.moderationStatus : "pending",
  };
}
