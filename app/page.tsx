import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Callout } from "@/components/ui/Callout";
import { brand } from "@/lib/config/brand";
import { isFirebaseConfigured } from "@/lib/config/env";

const principles = [
  {
    title: "Explicit intent",
    body: "Serious or consensual casual dating — stated up front, never implied, never misrepresented.",
  },
  {
    title: "Privacy by default",
    body: "Broad location only. Private photos with short-lived links. No covert monitoring, ever.",
  },
  {
    title: "Safety is free",
    body: "Reporting, blocking, safety guidance and account deletion are never behind a paywall.",
  },
  {
    title: "Consent you can audit",
    body: "Granular, versioned consent records you can review and withdraw from your privacy center.",
  },
];

export default function HomePage() {
  const firebaseReady = isFirebaseConfigured();

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-5 pt-16 pb-14 sm:px-8 sm:pt-24">
          <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">
            Adults only · 18+
          </p>
          <h1 className="text-ink mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
            Relationships with clear intent and real consent.
          </h1>
          <p className="text-ink-muted mt-6 max-w-2xl text-lg leading-relaxed">
            {brand.name} is a privacy-first relationship platform for adults. You choose what you
            are looking for, who can see you, and what you share — and you can change your mind at
            any time.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              className="bg-brand-strong hover:bg-brand rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
              href="/how-it-works"
            >
              How it works
            </Link>
            <Link
              className="border-line text-ink hover:border-brand rounded-lg border bg-white/60 px-5 py-3 text-sm font-semibold transition-colors dark:bg-white/[0.03]"
              href="/safety"
            >
              Our safety commitments
            </Link>
          </div>

          {!firebaseReady ? (
            <p className="border-line text-ink-muted mt-8 max-w-2xl rounded-lg border border-dashed bg-white/40 px-4 py-3 text-sm dark:bg-white/[0.02]">
              Firebase is not configured in this environment yet. The app boots without it; auth and
              data features turn on after the one-time setup in{" "}
              <code className="bg-brand-soft text-brand-strong rounded px-1.5 py-0.5 text-xs">
                docs/SETUP_FIREBASE.md
              </code>
              .
            </p>
          ) : null}
        </section>

        <section
          aria-labelledby="principles-heading"
          className="border-line/70 border-y bg-white/40 dark:bg-white/[0.02]"
        >
          <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
            <h2 id="principles-heading" className="text-ink text-2xl font-semibold tracking-tight">
              What we will not compromise on
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {principles.map((principle) => (
                <Callout key={principle.title} title={principle.title}>
                  {principle.body}
                </Callout>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-ink text-2xl font-semibold tracking-tight">
                Where this is going
              </h2>
              <p className="text-ink-muted mt-3 max-w-xl leading-relaxed">
                Phase 2 discovery and matching are now in development. Accounts, HttpOnly sessions,
                onboarding, prompts and discovery preferences have been verified against Firebase;
                discovery suggestions and mutual matches are not live yet. Photo uploads still await
                private Storage controls. This is not a public launch, and no payment is taken.
              </p>
              <p className="text-ink-muted mt-3 max-w-xl leading-relaxed">
                Product decisions and limits live in the open — no fake engagement, no dark
                patterns, no precise-location tracking.{" "}
                <Link
                  className="text-brand-strong font-medium underline underline-offset-4"
                  href="/how-it-works"
                >
                  See how discovery works
                </Link>
                .
              </p>
            </div>
            <div className="border-line bg-brand-soft/60 rounded-xl border p-5">
              <h3 className="text-brand-strong text-sm font-semibold tracking-wide uppercase">
                Build status
              </h3>
              <ul className="text-ink-muted mt-3 space-y-2 text-sm">
                <li>✅ Repo, docs, Firestore + Storage rules deployed</li>
                <li>✅ Auth, onboarding, prompts + preferences E2E</li>
                <li>✅ Server-side 18+ gate; exact DOB stored privately</li>
                <li>🟡 Phase 2: server-side discovery filters and ranking are being built</li>
                <li>⏸️ Photo uploads: waiting on private Storage controls</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
