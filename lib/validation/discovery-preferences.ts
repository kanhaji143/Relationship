import { z } from "zod";

import { LANGUAGE_CODES, REGION_IDS, type RegionId } from "@/lib/config/onboarding";
import { relationshipIntentSchema } from "@/lib/validation/auth";

const regionSchema = z
  .string()
  .refine(
    (region) => (REGION_IDS as readonly string[]).includes(region),
    "Choose a listed broad region.",
  );

const languageSchema = z
  .string()
  .refine(
    (language) => (LANGUAGE_CODES as readonly string[]).includes(language),
    "Choose a listed language.",
  );

export const discoveryPreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    desiredIntents: z.array(relationshipIntentSchema).min(1).max(2),
    preferredRegions: z.array(regionSchema).max(6),
    preferredLanguages: z.array(languageSchema).max(4),
    discoveryPaused: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.ageMin > value.ageMax) {
      context.addIssue({
        code: "custom",
        path: ["ageMax"],
        message: "Maximum age must be greater than or equal to minimum age.",
      });
    }
    if (new Set(value.desiredIntents).size !== value.desiredIntents.length) {
      context.addIssue({
        code: "custom",
        path: ["desiredIntents"],
        message: "Remove duplicate intents.",
      });
    }
    if (new Set(value.preferredRegions).size !== value.preferredRegions.length) {
      context.addIssue({
        code: "custom",
        path: ["preferredRegions"],
        message: "Remove duplicate regions.",
      });
    }
    if (new Set(value.preferredLanguages).size !== value.preferredLanguages.length) {
      context.addIssue({
        code: "custom",
        path: ["preferredLanguages"],
        message: "Remove duplicate languages.",
      });
    }
  });

export type DiscoveryPreferencesInput = z.infer<typeof discoveryPreferencesSchema>;

export type DiscoveryPreferencesDraft = Omit<DiscoveryPreferencesInput, "preferredRegions"> & {
  preferredRegions: RegionId[];
};
