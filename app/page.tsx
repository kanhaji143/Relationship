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
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-12 pb-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <div className="bg-brand-soft text-brand-strong inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase">
              <span className="bg-brand size-2 rounded-full" /> Adults only · 18+
            </div>
            <h1 className="text-ink mt-5 max-w-3xl text-5xl leading-[1.02] font-bold tracking-[-0.055em] text-balance sm:text-7xl">
              Meet with <span className="text-brand">clarity.</span> Connect with care.
            </h1>
            <p className="text-ink-muted mt-6 max-w-xl text-lg leading-relaxed sm:text-xl">
              {brand.name} is a privacy-first relationship platform for adults. Say what you want,
              discover at your pace and talk only when interest is mutual.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="bg-brand-strong hover:bg-brand shadow-brand/20 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg"
                href="/signup"
              >
                Create your account <span aria-hidden="true">→</span>
              </Link>
              <Link
                className="border-line text-ink hover:border-brand rounded-xl border bg-white/70 px-5 py-3.5 text-sm font-bold dark:bg-white/[0.03]"
                href="/how-it-works"
              >
                See how it works
              </Link>
            </div>
            <p className="text-ink-muted mt-4 text-xs font-medium">
              Free development preview · no payments taken
            </p>
            <div className="text-ink-muted mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
              <span>✓ Match-only messaging</span>
              <span>✓ Broad location only</span>
              <span>✓ Safety is free</span>
            </div>
          </div>

          <div
            className="hero-visual relative mx-auto h-[430px] w-full max-w-[500px]"
            aria-label="Bondora profile preview"
            role="img"
          >
            <div className="hero-visual-glow absolute inset-10 rounded-full" />
            <div className="hero-profile hero-profile-back absolute top-8 right-0 w-52 rotate-6 rounded-3xl p-4 shadow-xl sm:w-60">
              <div className="hero-avatar hero-avatar-sage">
                <span>R</span>
              </div>
              <p className="text-ink mt-3 font-bold">Riya, 28</p>
              <p className="text-ink-muted text-xs">Lucknow · serious intent</p>
            </div>
            <div className="hero-profile hero-profile-main absolute top-16 left-3 w-60 -rotate-5 rounded-3xl p-4 shadow-2xl sm:left-10 sm:w-72">
              <div className="hero-avatar hero-avatar-sunset">
                <span>A</span>
                <span className="hero-privacy-pill">private by default</span>
              </div>
              <p className="text-ink mt-3 text-lg font-bold">Aarav, 30</p>
              <p className="text-ink-muted text-xs">Delhi NCR · clear intent</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="hero-chip">Books</span>
                <span className="hero-chip">Travel</span>
                <span className="hero-chip">Hindi</span>
              </div>
              <div className="mt-5 flex gap-2">
                <span className="hero-action">×</span>
                <span className="hero-action hero-action-like">♥</span>
              </div>
            </div>
            <div className="hero-match absolute right-3 bottom-8 rounded-2xl px-4 py-3 shadow-xl sm:right-8">
              <span className="text-brand text-xs font-bold uppercase">Mutual match</span>
              <p className="text-ink mt-1 text-sm font-bold">A thoughtful hello starts here.</p>
            </div>
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
                The core Bondora experience is ready for controlled testing: profiles, discovery,
                mutual matches, private chat, safety reports, moderation and privacy controls.
                Advanced features such as video, verification and billing are intentionally
                postponed. This is a development preview, and no payment is taken.
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
                <li>✅ Auth, onboarding, prompts and preferences</li>
                <li>✅ Discovery, likes, matches and ranking</li>
                <li>✅ Participant-only chat and safety controls</li>
                <li>✅ Reports, moderation, appeals and audit logs</li>
                <li>✅ Private photo pipeline and privacy center</li>
                <li>⏸️ Video, verification, billing and advanced features</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
