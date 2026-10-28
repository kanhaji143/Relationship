/** Maps session-endpoint failures to user-facing copy. */
export function sessionErrorMessage(status: number): string {
  if (status === 503) {
    return "Sessions are not configured yet. An admin must finish Firebase setup (docs/SETUP_FIREBASE.md).";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (status === 401) {
    return "Your sign-in expired. Please try again.";
  }
  return "Could not start your session. Please try again.";
}

/** Maps registration-endpoint failures to user-facing copy. */
export function registrationErrorMessage(status: number): string {
  if (status === 503) {
    return "Your Firebase account was created, but server setup is incomplete. An admin must finish Firebase setup before you can continue.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (status === 409) {
    return "This email is already linked to an account. Try signing in instead.";
  }
  if (status === 401) {
    return "Your sign-in expired before setup finished. Sign in again to retry registration.";
  }
  return "Your account was created, but setup could not finish. Sign in again to retry.";
}
