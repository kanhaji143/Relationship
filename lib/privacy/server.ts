import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { userPrivateDoc } from "@/lib/firebase/collections";
import type { PrivacySettingsInput } from "@/lib/validation/privacy";

export type PrivacySettings = PrivacySettingsInput & { updatedAt: string | null };

const DEFAULTS: PrivacySettingsInput = {
  profileVisibility: "visible",
  discoveryPaused: false,
  showOnlineStatus: false,
  allowMessageRequests: true,
};

export async function getPrivacySettings(uid: string): Promise<PrivacySettings> {
  const doc = await getAdminDb().doc(userPrivateDoc(uid, "privacy")).get();
  const data = doc.exists ? (doc.data() ?? {}) : {};
  return {
    profileVisibility: data.profileVisibility === "hidden" ? "hidden" : DEFAULTS.profileVisibility,
    discoveryPaused:
      typeof data.discoveryPaused === "boolean" ? data.discoveryPaused : DEFAULTS.discoveryPaused,
    showOnlineStatus:
      typeof data.showOnlineStatus === "boolean"
        ? data.showOnlineStatus
        : DEFAULTS.showOnlineStatus,
    allowMessageRequests:
      typeof data.allowMessageRequests === "boolean"
        ? data.allowMessageRequests
        : DEFAULTS.allowMessageRequests,
    updatedAt:
      data.updatedAt && typeof data.updatedAt.toDate === "function"
        ? data.updatedAt.toDate().toISOString()
        : null,
  };
}

export async function savePrivacySettings(uid: string, input: PrivacySettingsInput): Promise<void> {
  await getAdminDb()
    .doc(userPrivateDoc(uid, "privacy"))
    .set(
      {
        ...input,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
