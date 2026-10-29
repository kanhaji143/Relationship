"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { MessageView } from "@/lib/messaging/server";

type Props = {
  conversationId: string;
  partnerUid: string;
  canSend: boolean;
  messages: MessageView[];
};

async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Ignore non-JSON errors.
  }
  return undefined;
}

export function ThreadPanel({ conversationId, partnerUid, canSend, messages }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"unmatch" | "block" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (!response.ok) {
        const code = await errorCode(response);
        setError(
          code === "rate_limited"
            ? "You are sending messages too quickly. Please wait a moment."
            : code === "blocked"
              ? "This conversation is closed for safety reasons."
              : "Your message couldn't be sent. Please try again.",
        );
        return;
      }
      setText("");
      router.refresh();
    } catch {
      setError("Your message couldn't be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function endMatch(action: "unmatch" | "block") {
    setPendingAction(action);
    setError(null);
    try {
      const url = action === "unmatch" ? `/api/matches/${conversationId}/unmatch` : "/api/blocks";
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: action === "block" ? JSON.stringify({ targetUid: partnerUid }) : undefined,
      });
      if (!response.ok) {
        setError("That action couldn't be completed. Please try again.");
        return;
      }
      router.push("/messages");
      router.refresh();
    } catch {
      setError("That action couldn't be completed. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <ol className="space-y-2">
        {messages.length === 0 ? (
          <li className="border-line rounded-xl border bg-white/70 p-5 text-sm dark:bg-white/[0.03]">
            No messages yet. Say hello when you are ready.
          </li>
        ) : (
          messages.map((message) => (
            <li
              key={message.id}
              className="border-line rounded-xl border bg-white/70 p-3 text-sm dark:bg-white/[0.03]"
            >
              <p className="text-ink break-words whitespace-pre-wrap">{message.body}</p>
              <p className="text-ink-muted mt-1 text-xs">
                {message.createdAt ? new Date(message.createdAt).toLocaleString("en-IN") : ""}
              </p>
            </li>
          ))
        )}
      </ol>

      {canSend ? (
        <form onSubmit={sendMessage} className="space-y-3">
          <label htmlFor="message" className="text-ink text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={1000}
            rows={3}
            className="border-line text-ink w-full rounded-lg border bg-white/70 p-3 text-sm dark:bg-white/[0.03]"
            placeholder="Write a message (up to 1000 characters)"
          />
          <Button type="submit" disabled={sending || text.trim().length === 0}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </form>
      ) : (
        <p className="text-ink-muted border-line rounded-xl border border-dashed p-4 text-sm">
          This conversation is read-only.
        </p>
      )}

      <div className="border-line flex flex-wrap gap-3 border-t pt-4">
        <Button
          variant="secondary"
          onClick={() => void endMatch("unmatch")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "unmatch" ? "Unmatching…" : "Unmatch"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void endMatch("block")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "block" ? "Blocking…" : "Block"}
        </Button>
      </div>
    </div>
  );
}
