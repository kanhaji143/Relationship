"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { requestPasswordReset } from "@/features/auth/client";
import { authErrorMessage, firebaseErrorCode } from "@/features/auth/errors";
import { isFirebaseClientConfigured } from "@/lib/firebase/client/app";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const firebaseReady = isFirebaseClientConfigured();

/** Always shows the same confirmation so account existence is not revealed. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.email);
      setSent(true);
    } catch (cause) {
      const code = firebaseErrorCode(cause);
      // Network and rate-limit failures are real errors; unknown emails are not.
      if (code === "auth/too-many-requests" || code === "auth/network-request-failed") {
        setError(authErrorMessage(code));
      } else {
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {!firebaseReady ? (
        <Alert tone="info">
          Firebase is not configured on this build, so reset emails cannot be sent yet.
        </Alert>
      ) : null}
      {sent ? (
        <Alert tone="success">
          If an account exists for that email, a reset link is on its way. Check spam too.
        </Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field
        id="forgot-email"
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button type="submit" disabled={!firebaseReady || submitting || sent}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
