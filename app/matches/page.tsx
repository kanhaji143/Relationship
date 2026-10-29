import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getMatchesForUser } from "@/lib/discovery/relations";
import { canonicalMatchId } from "@/lib/firebase/collections";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Matches",
  description: "Your mutual matches.",
};

async function MatchesContent() {
  const user = await requireSessionUser();
  const matches = await getMatchesForUser(user.uid);

  return (
    <>
      <header className="mb-6">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Matches</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Your matches</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Mutual matches appear here. Only you can see this list.
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
          <p className="text-ink-muted text-sm">
            No matches yet. When you and someone else like each other, you will see them here.
          </p>
          <div className="mt-4">
            <Link
              href="/discover"
              className="bg-brand-strong inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Discover people
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((person) => (
            <li
              key={person.uid}
              className="border-line rounded-xl border bg-white/70 p-5 dark:bg-white/[0.03]"
            >
              <p className="text-ink font-semibold">{person.displayName}</p>
              <p className="text-ink-muted mt-1 text-sm">{person.broadLocationLabel}</p>
              <Link
                href={`/messages/${canonicalMatchId(user.uid, person.uid)}`}
                className="border-line text-ink hover:border-brand mt-3 inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Message
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function MatchesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading matches…</p>}>
          <MatchesContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
