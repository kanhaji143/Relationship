import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an account for adults 18 and over.",
};

export default function SignupPage() {
  return (
    <section
      aria-labelledby="signup-heading"
      className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]"
    >
      <h1 id="signup-heading" className="text-ink text-2xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
        Adults only. Profile setup and age assurance come next, before any discovery access.
      </p>

      <div className="mt-6">
        <SignupForm />
      </div>

      <p className="border-line text-ink-muted mt-6 border-t pt-5 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-strong font-medium underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
