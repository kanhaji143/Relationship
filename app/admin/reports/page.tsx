import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getStaffRole, listReports } from "@/lib/admin/server";
import { requireSessionUser } from "@/lib/session";
import { ModerationActionForm } from "./ModerationActionForm";

export const metadata: Metadata = {
  title: "Moderation queue",
  description: "Staff-only report triage.",
};

async function QueueContent() {
  const user = await requireSessionUser();
  const role = await getStaffRole(user.uid);
  if (!role) redirect("/");

  const reports = await listReports("open");

  return (
    <>
      <header className="mb-6">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Admin</p>
        <h1 className="text-ink mt-2 text-2xl font-semibold tracking-tight">Moderation queue</h1>
        <p className="text-ink-muted mt-2 text-sm">
          Signed in as staff ({role}). {reports.length} open report{reports.length === 1 ? "" : "s"}
          .
        </p>
      </header>

      {reports.length === 0 ? (
        <p className="text-ink-muted text-sm">No open reports.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-line rounded-xl border bg-white/70 p-4 text-sm dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-ink font-semibold">{report.category}</p>
                <p className="text-ink-muted text-xs">
                  {report.priority} priority · {report.status}
                </p>
              </div>
              <p className="text-ink-muted mt-1 text-xs">
                reporter {report.reporterUid} → target {report.targetUid}
                {report.conversationId ? ` · conversation ${report.conversationId}` : ""}
              </p>
              {report.description ? (
                <p className="text-ink mt-2 break-words whitespace-pre-wrap">
                  {report.description}
                </p>
              ) : null}
              <p className="text-ink-muted mt-2 text-xs">{report.createdAt ?? "just now"}</p>
              <ModerationActionForm reportId={report.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminReportsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading queue…</p>}>
          <QueueContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
