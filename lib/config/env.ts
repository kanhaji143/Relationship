import "server-only";

import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Rules:
 * - Never import this module from a Client Component.
 * - Firebase web config is optional in Phase 0 so the app can boot before a
 *   Firebase project exists; `assertFirebaseConfigured()` gives a clear error
 *   the moment a feature that needs it is used.
 * - Secrets are never echoed back in error messages.
 */

const optional = z.string().trim().optional().default("");
const optionalEmail = z
  .union([z.literal(""), z.email()])
  .optional()
  .default("");

/** Treats empty strings as "unset" so `.env` placeholders cannot break boot. */
function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const optionalUrl = z.preprocess(emptyToUndefined, z.url().default("http://localhost:3000"));

const brandName = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).max(40).default("Bondora"),
);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_BRAND_NAME: brandName,
  NEXT_PUBLIC_SUPPORT_EMAIL: optionalEmail,
  NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME: z.string().trim().max(120).optional().default(""),
  NEXT_PUBLIC_GRIEVANCE_OFFICER_CONTACT: optionalEmail,

  NEXT_PUBLIC_FIREBASE_API_KEY: optional,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: optional,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: optional,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: optional,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: optional,
  NEXT_PUBLIC_FIREBASE_APP_ID: optional,
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: z.enum(["true", "false"]).optional().default("false"),
});

export const serverEnvSchema = publicEnvSchema.extend({
  FIREBASE_SERVICE_ACCOUNT_KEY_PATH: optional,
  BILLING_TEST_MODE: z.enum(["true", "false"]).optional().default("true"),
  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(issues: string[]) {
    super(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
  }
}

function parseWith<T extends z.ZodType>(schema: T, source: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    // Only field paths and messages — never the submitted values.
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    );
    throw new EnvValidationError(issues);
  }
  return result.data;
}

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseWith(serverEnvSchema, process.env);
  return cachedServerEnv;
}

export function getPublicEnv(): PublicEnv {
  return parseWith(publicEnvSchema, process.env);
}

export function isFirebaseConfigured(env: PublicEnv = getPublicEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function assertFirebaseConfigured(env: PublicEnv = getPublicEnv()): void {
  if (!isFirebaseConfigured(env)) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and set the NEXT_PUBLIC_FIREBASE_* values (see docs/SETUP_FIREBASE.md).",
    );
  }
}

/** Test helper: drops the memoized parse so a changed environment is visible. */
export function resetEnvCache(): void {
  cachedServerEnv = null;
}
