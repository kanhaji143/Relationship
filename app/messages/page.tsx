import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getConversationsForUser } from "@/lib/messaging/server";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your conversations with mutual matches.",
};

function formatTimestamp(value: string | null): string {
  if (!value) return "New conversation";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New conversation";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

async function MessagesContent() {
  const user = await requireSessionUser();
  const conversations = await getConversationsForUser(user.uid);

  return (
    <>
      <header className="mb-6">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Messages</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Your conversations</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Only you and your match can read these messages.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
          <p className="text-ink-muted text-sm">
            No conversations yet. Messaging opens when you and someone else like each other.
          </p>
          <div className="mt-4">
            <Link
              href="/matches"
              className="bg-brand-strong inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              View matches
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                className="border-line hover:border-brand block rounded-xl border bg-white/70 p-5 dark:bg-white/[0.03]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-ink font-semibold">{conversation.partner.displayName}</p>
                  <p className="text-ink-muted shrink-0 text-xs">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </p>
                </div>
                <p className="text-ink-muted mt-1 text-sm">
                  {conversation.partner.broadLocationLabel}
                </p>
                <p className="text-ink-muted mt-2 line-clamp-2 text-sm">
                  {conversation.lastMessagePreview ?? "Say hello — you matched."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function MessagesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading conversations…</p>}>
          <MessagesContent />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
