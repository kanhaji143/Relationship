import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getLikesForUser } from "@/lib/discovery/relations";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Likes",
  description: "Likes you have sent and received.",
};

async function LikesContent() {
  const user = await requireSessionUser();
  const likes = await getLikesForUser(user.uid);

  return (
    <>
      <header className="mb-6">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Likes</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Your likes</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Likes sent and received are private to your account.
        </p>
      </header>

      {likes.sent.length === 0 && likes.received.length === 0 ? (
        <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
          <p className="text-ink-muted text-sm">
            No likes yet. Start discovering people to see them here.
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
        <div className="space-y-8">
          <section aria-labelledby="received-likes-heading">
            <h2 id="received-likes-heading" className="text-ink mb-3 text-lg font-semibold">
              Likes you received
            </h2>
            {likes.received.length > 0 ? (
              <ul className="space-y-3">
                {likes.received.map((person) => (
                  <li
                    key={person.uid}
                    className="border-line rounded-xl border bg-white/70 p-5 dark:bg-white/[0.03]"
                  >
                    <p className="text-ink font-semibold">{person.displayName}</p>
                    <p className="text-ink-muted mt-1 text-sm">{person.broadLocationLabel}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted text-sm">No received likes yet.</p>
            )}
          </section>

          <section aria-labelledby="sent-likes-heading">
            <h2 id="sent-likes-heading" className="text-ink mb-3 text-lg font-semibold">
              Likes you sent
            </h2>
            {likes.sent.length > 0 ? (
              <ul className="space-y-3">
                {likes.sent.map((person) => (
                  <li
                    key={person.uid}
                    className="border-line rounded-xl border bg-white/70 p-5 dark:bg-white/[0.03]"
                  >
                    <p className="text-ink font-semibold">{person.displayName}</p>
                    <p className="text-ink-muted mt-1 text-sm">{person.broadLocationLabel}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted text-sm">You have not sent any likes yet.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default function LikesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading likes…</p>}>
          <LikesContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
