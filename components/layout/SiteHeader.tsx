import Link from "next/link";

import { brand } from "@/lib/config/brand";

export function SiteHeader() {
  return (
    <header className="border-line/70 bg-canvas/90 sticky top-0 z-40 border-b shadow-[0_8px_28px_rgba(95,40,72,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
          <span
            aria-hidden="true"
            className="from-brand to-brand-strong grid size-9 place-items-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-sm"
          >
            {brand.name.slice(0, 1)}
          </span>
          <span className="text-ink text-lg font-bold tracking-tight">{brand.name}</span>
          {brand.provisional ? (
            <span className="border-line text-ink-muted hidden rounded-full border px-2 py-0.5 text-[11px] font-medium sm:inline">
              working name
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/safety"
            className="bg-accent-soft text-accent hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:inline"
          >
            Safety-first preview
          </Link>
          <Link
            href="/discover"
            className="text-ink-muted hover:text-brand hidden text-sm font-medium lg:inline"
          >
            Discover
          </Link>
          <Link
            href="/matches"
            className="text-ink-muted hover:text-brand hidden text-sm font-medium lg:inline"
          >
            Matches
          </Link>
          <Link
            href="/login"
            className="border-line text-ink hover:border-brand rounded-lg border px-3 py-1.5 text-sm font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-brand-strong hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 sm:inline-flex"
          >
            Join preview
          </Link>
        </div>
      </div>
    </header>
  );
}
