import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { Alert } from "@/components/ui/Alert";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { getProfileSummary, type ProfileSummary } from "@/lib/profile/server";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account",
  description: "Account overview.",
};

const INTENT_LABELS: Record<"serious" | "casual", string> = {
  serious: "Serious relationship",
  casual: "Casual dating",
};

async function AccountContent() {
  const user = await requireSessionUser();

  let profile: ProfileSummary | null = null;
  let profileError = false;
  try {
    profile = await getProfileSummary(user.uid);
  } catch {
    profileError = true;
  }

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
        {profileError ? (
          <Alert tone="error">
            We could not load your profile right now. Refresh in a moment or contact support.
          </Alert>
        ) : null}

        {!profileError && !profile ? (
          <>
            <Alert tone="info">
              Your profile is not set up yet. Add your basics, broad region, languages and interests
              to unlock discovery later.
            </Alert>
            <Link
              href="/onboarding"
              className="bg-brand-strong inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Complete profile
            </Link>
          </>
        ) : null}

        {profile ? (
          <>
            <div className="border-line rounded-xl border bg-white/50 p-5 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-ink text-xl font-semibold">{profile.displayName}</h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    {INTENT_LABELS[profile.intent ?? "serious"]} · {profile.broadLocationLabel}
                  </p>
                </div>
                <Link
                  href="/onboarding"
                  className="border-line text-ink hover:border-brand rounded-lg border px-3 py-1.5 text-sm font-medium"
                >
                  Edit profile
                </Link>
              </div>
              {profile.bio ? (
                <p className="text-ink-muted mt-4 text-sm leading-relaxed">{profile.bio}</p>
              ) : null}
              <dl className="text-ink-muted mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium">Languages</dt>
                  <dd>{profile.languages.join(", ") || "Not set"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Interests</dt>
                  <dd>{profile.interestCount} selected</dd>
                </div>
                <div>
                  <dt className="font-medium">Profile visibility</dt>
                  <dd>{profile.visibility === "visible" ? "Visible" : "Hidden"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Photo moderation</dt>
                  <dd>
                    {profile.moderationStatus === "pending"
                      ? "No photos yet"
                      : profile.moderationStatus}
                  </dd>
                </div>
              </dl>
            </div>
            <Alert tone="info">
              Photos, prompt answers and discovery filters arrive in the next slice. Discovery stays
              locked until those safety checks are in place.
            </Alert>
          </>
        ) : null}

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
