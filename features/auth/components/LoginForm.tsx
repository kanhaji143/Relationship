"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { exchangeSession, signInWithEmail } from "@/features/auth/client";
import { authErrorMessage, firebaseErrorCode } from "@/features/auth/errors";
import { sessionErrorMessage } from "@/features/auth/session-error";
import { isFirebaseClientConfigured } from "@/lib/firebase/client/app";
import { loginSchema } from "@/lib/validation/auth";

const firebaseReady = isFirebaseClientConfigured();

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await signInWithEmail(parsed.data.email, parsed.data.password);
      const response = await exchangeSession(idToken);
      if (!response.ok) {
        setError(sessionErrorMessage(response.status));
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
          values from <code>docs/SETUP_FIREBASE.md</code> to enable sign-in.
        </Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field
        id="login-email"
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
        id="login-password"
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button type="submit" disabled={!firebaseReady || submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-ink-muted text-sm">
        <Link href="/forgot-password" className="text-brand-strong font-medium underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
