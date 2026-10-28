import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { DiscoveryPreferencesForm } from "@/features/preferences/DiscoveryPreferencesForm";
import { getDiscoveryPreferences } from "@/lib/preferences/server";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Discovery preferences",
  description: "Choose broad, privacy-preserving discovery filters.",
};

async function DiscoveryContent() {
  const user = await requireSessionUser();
  const preferences = await getDiscoveryPreferences(user.uid);

  return (
    <>
      <header className="mb-8">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Settings</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">
          Discovery preferences
        </h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Signed in as <span className="text-ink font-medium">{user.email ?? user.uid}</span>.
        </p>
      </header>
      <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
        <DiscoveryPreferencesForm initialPreferences={preferences} />
      </div>
      <p className="text-ink-muted mt-5 text-sm">
        Your profile intent is separate and unchanged. Return to{" "}
        <Link className="text-brand-strong underline" href="/account">
          your account
        </Link>
        .
      </p>
    </>
  );
}

export default function DiscoverySettingsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading preferences…</p>}>
          <DiscoveryContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
