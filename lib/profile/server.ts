import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { preferencesDoc, profileDoc } from "@/lib/firebase/collections";

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
