import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MarketingShell } from "@/components/layout/MarketingShell";
import { getConversationThread } from "@/lib/messaging/server";
import { requireSessionUser } from "@/lib/session";

import { ThreadPanel } from "./ThreadPanel";

export const metadata: Metadata = {
  title: "Conversation",
  description: "A private conversation with your match.",
};

type Props = { params: Promise<{ conversationId: string }> };

async function ConversationContent({ conversationId }: { conversationId: string }) {
  const user = await requireSessionUser();
  const thread = await getConversationThread(user.uid, conversationId);
  if (!thread) notFound();

  return (
    <>
      <header className="mb-6">
        <Link href="/messages" className="text-brand text-sm font-medium hover:underline">
          ← All conversations
        </Link>
        <h1 className="text-ink mt-3 text-2xl font-semibold tracking-tight">
          {thread.partner.displayName}
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          {thread.partner.broadLocationLabel} ·{" "}
          {thread.status === "active" ? "Active match" : "Conversation closed"}
        </p>
      </header>

      <ThreadPanel
        conversationId={thread.id}
        partnerUid={thread.partner.uid}
        canSend={thread.canSend}
        messages={thread.messages}
      />
    </>
  );
}

export default function ConversationPage({ params }: Props) {
  return (
    <MarketingShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Suspense fallback={<p className="text-ink-muted text-sm">Loading conversation…</p>}>
          <ConversationRoute params={params} />
        </Suspense>
      </section>
    </MarketingShell>
  );
}

async function ConversationRoute({ params }: Props) {
  const { conversationId } = await params;
  return <ConversationContent conversationId={conversationId} />;
}
