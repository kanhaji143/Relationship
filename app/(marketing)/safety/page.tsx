import type { Metadata } from "next";

import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "Safety",
  description: "Safety commitments: reporting, blocking, privacy controls and account deletion.",
};

const commitments = [
  {
    title: "Free safety tools",
    body: "Reporting, blocking, the safety center, and account deletion are never paywalled or hidden behind an upgrade.",
  },
  {
    title: "Human review for serious reports",
    body: "Non-consensual imagery, threats, impersonation, minors and immediate danger are prioritized and reviewed by trained staff.",
  },
  {
    title: "Blocks that actually work",
    body: "Blocked pairs are excluded in both directions across discovery, likes, matches and messaging.",
  },
  {
    title: "Honest privacy claims",
    body: "No end-to-end encryption claim. Data is protected in transit and access is restricted and audited.",
  },
  {
    title: "Delete means delete",
    body: "Account deletion requests have a tracked lifecycle, with retention exceptions explained in plain language.",
  },
  {
    title: "Adults only",
    body: "Age assurance is part of onboarding. Accounts that fail it are blocked before any discovery access.",
  },
];

export default function SafetyPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <h1 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
          Safety commitments
        </h1>
        <p className="text-ink-muted mt-4 leading-relaxed">
          Safety is a product requirement, not a premium tier. These commitments are part of the
          launch gate and are reviewed before private beta.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {commitments.map((commitment) => (
            <div
              key={commitment.title}
              className="border-line rounded-xl border bg-white/50 p-5 dark:bg-white/[0.03]"
            >
              <h2 className="text-ink font-semibold">{commitment.title}</h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">{commitment.body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
