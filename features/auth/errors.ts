/**
 * User-facing auth error messages.
 * Deliberately generic for credential failures so account existence is not
 * revealed (Firebase already returns a single error for both cases).
 */

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account is not available. Contact support.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Choose a stronger password (at least 12 characters).",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "auth/missing-password": "Enter your password.",
  "auth/operation-not-allowed": "Email sign-in is not enabled. Contact support.",
};

export function authErrorMessage(code?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Something went wrong. Please try again.";
}

export function firebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}
