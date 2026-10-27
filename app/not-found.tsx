import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-24">
      <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">404</p>
      <h1 className="text-ink mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-ink-muted mt-3 leading-relaxed">
        This page does not exist yet. Most areas are still being built phase by phase.
      </p>
      <Link
        href="/"
        className="bg-brand-strong hover:bg-brand mt-8 w-fit rounded-lg px-5 py-3 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </main>
  );
}
