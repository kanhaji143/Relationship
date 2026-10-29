import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getPrivacySettings } from "@/lib/privacy/server";
import { requireSessionUser } from "@/lib/session";

import { PrivacySettingsForm } from "./PrivacySettingsForm";

export const metadata: Metadata = {
  title: "Privacy center",
  description: "Control your visibility and data.",
};

async function PrivacyContent() {
  const user = await requireSessionUser();
  const settings = await getPrivacySettings(user.uid);

  return <PrivacySettingsForm initialSettings={settings} />;
}

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading privacy settings…</p>}>
          <PrivacyContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
