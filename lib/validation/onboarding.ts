import { z } from "zod";

import {
  INTEREST_IDS,
  LANGUAGE_CODES,
  ONBOARDING_COUNTRY,
  REGION_IDS,
  type RegionId,
} from "@/lib/config/onboarding";
import {
  birthDateSchema,
  displayNameSchema,
  isAdultBirthDate,
  isPlausibleBirthDate,
  relationshipIntentSchema,
} from "@/lib/validation/auth";

/**
 * Onboarding input (Phase 1B).
 *
 * Server-authoritative rules:
 * - 18+ is re-checked on the server; the client check is only feedback.
 * - country is fixed to IN for the MVP.
 * - interests/languages/regions are allow-listed, not free text.
 */

const cleanText = (value: string) => !/[\u0000-\u001f\u007f<>]/.test(value);

export const bioSchema = z
  .string()
  .trim()
  .max(300, "Keep your bio under 300 characters.")
  .refine(cleanText, "Remove control characters and angle brackets.");

export const onboardingSchema = z
  .object({
    displayName: displayNameSchema,
    birthDate: birthDateSchema,
    intent: relationshipIntentSchema,
    region: z
      .enum(REGION_IDS as [RegionId, ...RegionId[]])
      .nullable()
      .default(null),
    languages: z
      .array(
        z
          .string()
          .refine(
            (code) => (LANGUAGE_CODES as readonly string[]).includes(code),
            "Choose a listed language.",
          ),
      )
      .min(1, "Choose at least one language.")
      .max(4, "Choose up to four languages."),
    bio: bioSchema.default(""),
    interestIds: z
      .array(
        z
          .string()
          .refine(
            (id) => (INTEREST_IDS as readonly string[]).includes(id),
            "Choose a listed interest.",
          ),
      )
      .min(3, "Choose at least three interests.")
      .max(8, "Choose up to eight interests."),
    countryCode: z.literal(ONBOARDING_COUNTRY).default(ONBOARDING_COUNTRY),
  })
  .superRefine((value, ctx) => {
    if (!isAdultBirthDate(value.birthDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "You must be at least 18 years old.",
      });
    } else if (!isPlausibleBirthDate(value.birthDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "Enter a valid birth date.",
      });
    }

    if (new Set(value.languages).size !== value.languages.length) {
      ctx.addIssue({ code: "custom", path: ["languages"], message: "Languages must be unique." });
    }
    if (new Set(value.interestIds).size !== value.interestIds.length) {
      ctx.addIssue({ code: "custom", path: ["interestIds"], message: "Interests must be unique." });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
