import Link from "next/link";

import { brand } from "@/lib/config/brand";

export function SiteHeader() {
  return (
    <header className="border-line/70 border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
          <span
            aria-hidden="true"
            className="bg-brand-soft text-brand-strong grid size-8 place-items-center rounded-full text-sm font-bold"
          >
            {brand.name.slice(0, 1)}
          </span>
          <span className="text-ink text-lg font-semibold tracking-tight">{brand.name}</span>
          {brand.provisional ? (
            <span className="border-line text-ink-muted hidden rounded-full border px-2 py-0.5 text-[11px] font-medium sm:inline">
              working name
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-3">
          <span className="bg-accent-soft text-accent hidden rounded-full px-3 py-1 text-xs font-medium sm:inline">
            Phase 3 · development preview
          </span>
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
