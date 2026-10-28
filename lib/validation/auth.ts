import { z } from "zod";

/**
 * Auth-phase input validation (signup, login, onboarding basics).
 *
 * These schemas are shared by server routes, Cloud Functions and forms so the
 * same rules apply everywhere. They validate shape only; authorization and
 * persistence stay on the server.
 */

export const MIN_AGE = 18;
export const MAX_AGE = 120;

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use at most 128 characters.")
  .refine((value) => !/^\s|\s$/.test(value), "Leading/trailing spaces are not allowed.");

export const emailSchema = z
  .string()
  .trim()
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."))
  .transform((value) => normalizeEmail(value));

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Parses a strictly-formatted ISO calendar date (YYYY-MM-DD).
 * Returns null for malformed or impossible dates (e.g. 1990-02-30), which
 * `new Date()` alone would silently roll over.
 */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** ISO calendar date (YYYY-MM-DD), validated against real calendar days. */
export const birthDateSchema = z
  .string()
  .refine((value) => parseIsoDate(value) !== null, "Enter a valid date.");

export function isAdultBirthDate(birthDate: string, now: Date = new Date()): boolean {
  const date = parseIsoDate(birthDate);
  if (!date) return false;
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - MIN_AGE, now.getUTCMonth(), now.getUTCDate()),
  );
  return date.getTime() <= cutoff.getTime();
}

export function isPlausibleBirthDate(birthDate: string, now: Date = new Date()): boolean {
  const date = parseIsoDate(birthDate);
  if (!date) return false;
  const oldest = Date.UTC(now.getUTCFullYear() - MAX_AGE, now.getUTCMonth(), now.getUTCDate());
  return date.getTime() >= oldest && date.getTime() <= now.getTime();
}

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(40, "Use at most 40 characters.")
  .refine(
    (value) => !/[\u0000-\u001f\u007f<>]/.test(value),
    "Remove control characters and angle brackets.",
  );

export const relationshipIntentSchema = z.enum(["serious", "casual"]);

export const localeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a BCP 47 language tag such as en-IN.");

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
    birthDate: birthDateSchema,
    intent: relationshipIntentSchema,
    locale: localeSchema.default("en-IN"),
    acceptedTerms: z.literal(true, "You must accept the Terms to continue."),
    acceptedPrivacy: z.literal(true, "You must accept the Privacy Policy to continue."),
    policyVersion: z.string().trim().min(1).max(20),
  })
  .superRefine((value, ctx) => {
    if (!isAdultBirthDate(value.birthDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "You must be at least 18 years old.",
      });
    } else if (!isPlausibleBirthDate(value.birthDate)) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Enter a valid birth date." });
    }

    const localPart = value.email.split("@")[0]?.toLowerCase() ?? "";
    if (localPart.length >= 3 && value.password.toLowerCase().includes(localPart)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must not contain your email address.",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

/** Phase 1A signup: account + consents only; profile/onboarding comes next. */
export const authSignupSchema = z.object({
  adultConfirmed: z.literal(true, "You must confirm you are 18 or older."),
  acceptedTerms: z.literal(true, "You must accept the Terms to continue."),
  acceptedPrivacy: z.literal(true, "You must accept the Privacy Policy to continue."),
  locale: localeSchema.default("en-IN"),
  policyVersion: z.string().trim().min(1).max(20),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const onboardingBasicsSchema = z.object({
  displayName: displayNameSchema,
  birthDate: birthDateSchema,
  intent: relationshipIntentSchema,
  locale: localeSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type AuthSignupInput = z.infer<typeof authSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type OnboardingBasicsInput = z.infer<typeof onboardingBasicsSchema>;
