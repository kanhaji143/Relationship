import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { requireSessionUser } from "@/lib/session";
import { DiscoveryFeed } from "@/app/discover/DiscoveryFeed";

export const metadata: Metadata = {
  title: "Discover",
  description: "Find compatible people with clear intent and broad location.",
};

async function DiscoverContent() {
  const user = await requireSessionUser();

  return (
    <>
      <header className="mb-6">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Discovery</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Discover people</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Signed in as <span className="text-ink font-medium">{user.email ?? user.uid}</span>.
          Profiles appear based on your intent, age range and broad preferences. Ranking is a
          sorting aid, not a prediction of relationship success.
        </p>
      </header>

      <DiscoveryFeed />
      <nav aria-label="Discovery navigation" className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/likes"
          className="border-line text-ink hover:border-brand rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Likes
        </Link>
        <Link
          href="/matches"
          className="border-line text-ink hover:border-brand rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Matches
        </Link>
        <Link
          href="/settings/discovery"
          className="border-line text-ink hover:border-brand rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Filters
        </Link>
      </nav>
    </>
  );
}

export default function DiscoverPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading discovery…</p>}>
          <DiscoverContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
