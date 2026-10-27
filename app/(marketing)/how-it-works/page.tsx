import type { Metadata } from "next";

import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How intent, consent, discovery and privacy work on this adults-only relationship platform.",
};

const steps = [
  {
    title: "1. Say what you want",
    body: "Choose serious dating or consensual casual dating. Your intent is visible and can be changed — it is never guessed or misrepresented.",
  },
  {
    title: "2. Get verified as an adult",
    body: "Age assurance happens during onboarding. Underage accounts are blocked. No raw ID documents are stored by default.",
  },
  {
    title: "3. Control what you share",
    body: "Broad location only, visibility controls, discovery pause, and private photos served through short-lived links.",
  },
  {
    title: "4. Discover with hard filters",
    body: "Blocks work in both directions. Paused or hidden profiles never appear. Intent and age filters are enforced server-side.",
  },
  {
    title: "5. Chat only after a mutual match",
    body: "One conversation per match, participant-only access. Report, block and unmatch are available at every step.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <h1 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h1>
        <p className="text-ink-muted mt-4 leading-relaxed">
          The product is designed around clear intent and informed consent. These steps describe the
          intended MVP behaviour; features ship phase by phase.
        </p>

        <ol className="mt-10 space-y-8">
          {steps.map((step) => (
            <li key={step.title}>
              <h2 className="text-ink text-lg font-semibold">{step.title}</h2>
              <p className="text-ink-muted mt-2 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="border-line text-ink-muted mt-12 rounded-lg border bg-white/50 px-4 py-3 text-sm dark:bg-white/[0.03]">
          This page is intentionally plain. No dark patterns, no artificial urgency, no hidden
          charges, and no fake activity.
        </p>
      </section>
    </MarketingShell>
  );
}
