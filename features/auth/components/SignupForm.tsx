"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  exchangeSession,
  registerAccount,
  signUpWithEmail,
  type RegisterPayload,
} from "@/features/auth/client";
import { authErrorMessage, firebaseErrorCode } from "@/features/auth/errors";
import { registrationErrorMessage, sessionErrorMessage } from "@/features/auth/session-error";
import { POLICY_LOCALE, POLICY_VERSION } from "@/lib/config/legal";
import { isFirebaseClientConfigured } from "@/lib/firebase/client/app";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";

const firebaseReady = isFirebaseClientConfigured();

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.issues[0]?.message ?? "Choose a stronger password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!adultConfirmed) {
      setError("You must confirm you are 18 or older.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Accept the Terms and Privacy Policy to continue.");
      return;
    }

    const payload: RegisterPayload = {
      adultConfirmed: true,
      acceptedTerms: true,
      acceptedPrivacy: true,
      locale: POLICY_LOCALE,
      policyVersion: POLICY_VERSION,
    };

    setSubmitting(true);
    try {
      const idToken = await signUpWithEmail(emailResult.data, password);
      const registration = await registerAccount(idToken, payload);
      if (!registration.ok) {
        setError(registrationErrorMessage(registration.status));
        return;
      }

      const session = await exchangeSession(idToken);
      if (!session.ok) {
        setError(sessionErrorMessage(session.status));
        return;
      }

      router.replace("/account");
      router.refresh();
    } catch (cause) {
      setError(authErrorMessage(firebaseErrorCode(cause)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {!firebaseReady ? (
        <Alert tone="info">
          Firebase is not configured on this build. Add the <code>NEXT_PUBLIC_FIREBASE_*</code>{" "}
          values from <code>docs/SETUP_FIREBASE.md</code> to enable account creation.
        </Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field
        id="signup-email"
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Field
        id="signup-password"
        label="Password"
        type="password"
        name="new-password"
        autoComplete="new-password"
        required
        hint="At least 12 characters. Do not reuse another site's password."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Field
        id="signup-confirm-password"
        label="Confirm password"
        type="password"
        name="confirm-password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-ink text-sm font-medium">Before you continue</legend>
        <label className="text-ink-muted flex items-start gap-2.5 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-brand)]"
            checked={adultConfirmed}
            onChange={(event) => setAdultConfirmed(event.target.checked)}
          />
          <span>I confirm I am 18 or older. Age verification is completed during onboarding.</span>
        </label>
        <label className="text-ink-muted flex items-start gap-2.5 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-brand)]"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>I accept the Terms of Service.</span>
        </label>
        <label className="text-ink-muted flex items-start gap-2.5 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-brand)]"
            checked={acceptedPrivacy}
            onChange={(event) => setAcceptedPrivacy(event.target.checked)}
          />
          <span>I accept the Privacy Policy.</span>
        </label>
      </fieldset>

      <Button type="submit" disabled={!firebaseReady || submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
