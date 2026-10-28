import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { PromptEditor } from "@/features/prompts/PromptEditor";
import { getPromptAnswers } from "@/lib/prompts/server";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile prompts",
  description: "Edit a few optional, moderated profile answers.",
};

async function PromptsContent() {
  const user = await requireSessionUser();
  const answers = await getPromptAnswers(user.uid);

  return (
    <>
      <header className="mb-8">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Profile</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">
          A little more about you
        </h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Signed in as <span className="text-ink font-medium">{user.email ?? user.uid}</span>.
        </p>
      </header>
      <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
        <PromptEditor initialAnswers={answers} />
      </div>
    </>
  );
}

export default function PromptsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading your prompts…</p>}>
          <PromptsContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
