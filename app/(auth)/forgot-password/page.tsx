import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <section
      aria-labelledby="forgot-heading"
      className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]"
    >
      <h1 id="forgot-heading" className="text-ink text-2xl font-semibold tracking-tight">
        Reset your password
      </h1>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
        We will email a reset link if an account exists for that address.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="border-line text-ink-muted mt-6 border-t pt-5 text-sm">
        <Link href="/login" className="text-brand-strong font-medium underline">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
