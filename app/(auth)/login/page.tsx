import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account.",
};

export default function LoginPage() {
  return (
    <section
      aria-labelledby="login-heading"
      className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]"
    >
      <h1 id="login-heading" className="text-ink text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
        Sign in to continue. Sessions are kept in a secure, HttpOnly cookie.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="border-line text-ink-muted mt-6 border-t pt-5 text-sm">
        New here?{" "}
        <Link href="/signup" className="text-brand-strong font-medium underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}
