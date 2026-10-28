import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { Alert } from "@/components/ui/Alert";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account",
  description: "Account overview.",
};

async function AccountContent() {
  const user = await requireSessionUser();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-ink text-3xl font-semibold tracking-tight">Your account</h1>
          <p className="text-ink-muted mt-2 text-sm">
            Signed in as <span className="text-ink font-medium">{user.email ?? user.uid}</span>
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 space-y-4">
        <Alert tone="info">
          Profile setup (display name, birth date and age assurance, location, interests) is the
          next build slice. Discovery stays locked until it is complete.
        </Alert>

        <div className="border-line rounded-xl border p-5">
          <h2 className="text-ink font-semibold">Account status</h2>
          <dl className="text-ink-muted mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Email verified</dt>
              <dd>{user.emailVerified ? "Yes" : "Not yet"}</dd>
            </div>
            <div>
              <dt className="font-medium">Account ID</dt>
              <dd className="break-all">{user.uid}</dd>
            </div>
          </dl>
        </div>

        <p className="text-ink-muted text-sm">
          <Link href="/safety" className="text-brand-strong font-medium underline">
            Safety tools
          </Link>{" "}
          and account deletion are always free.
        </p>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading your account…</p>}>
          <AccountContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
