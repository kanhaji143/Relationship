import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { OnboardingForm } from "@/features/onboarding/OnboardingForm";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Set up your profile",
  description: "Adults-only profile setup: basics, broad region, languages and interests.",
};

async function OnboardingContent() {
  const user = await requireSessionUser();

  return (
    <>
      <header className="mb-8">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Step 1 of 1</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Set up your profile</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Signed in as <span className="text-ink font-medium">{user.email ?? user.uid}</span>. This
          takes about two minutes.
        </p>
      </header>

      <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
        <OnboardingForm />
      </div>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading profile setup…</p>}>
          <OnboardingContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
