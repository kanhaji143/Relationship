import "server-only";

import { getAdminDb } from "@/lib/firebase/admin/app";
import { preferencesDoc } from "@/lib/firebase/collections";
import { LANGUAGE_CODES, REGION_IDS, type RegionId } from "@/lib/config/onboarding";
import type { DiscoveryPreferencesDraft } from "@/lib/validation/discovery-preferences";

export const DEFAULT_DISCOVERY_PREFERENCES: DiscoveryPreferencesDraft = {
  ageMin: 18,
  ageMax: 99,
  desiredIntents: ["serious"],
  preferredRegions: [],
  preferredLanguages: [],
  discoveryPaused: false,
};

/** Returns only fields needed by the owner-editable discovery settings form. */
export async function getDiscoveryPreferences(uid: string): Promise<DiscoveryPreferencesDraft> {
  const snapshot = await getAdminDb().doc(preferencesDoc(uid)).get();
  if (!snapshot.exists) return DEFAULT_DISCOVERY_PREFERENCES;

  const data = snapshot.data() ?? {};
  const intents = Array.isArray(data.desiredIntents)
    ? data.desiredIntents.filter(
        (value): value is "serious" | "casual" => value === "serious" || value === "casual",
      )
    : [];

  return {
    ageMin:
      typeof data.ageMin === "number" && data.ageMin >= 18 && data.ageMin <= 99
        ? data.ageMin
        : DEFAULT_DISCOVERY_PREFERENCES.ageMin,
    ageMax:
      typeof data.ageMax === "number" && data.ageMax >= 18 && data.ageMax <= 99
        ? data.ageMax
        : DEFAULT_DISCOVERY_PREFERENCES.ageMax,
    desiredIntents: intents.length > 0 ? intents : ["serious"],
    preferredRegions: Array.isArray(data.preferredRegions)
      ? data.preferredRegions.filter(
          (value): value is RegionId =>
            typeof value === "string" && (REGION_IDS as readonly string[]).includes(value),
        )
      : [],
    preferredLanguages: Array.isArray(data.preferredLanguages)
      ? data.preferredLanguages.filter(
          (value): value is string =>
            typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value),
        )
      : [],
    discoveryPaused: data.discoveryPaused === true,
  };
}
