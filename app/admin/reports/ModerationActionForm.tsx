"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  reportId: string;
};

const ACTIONS = [
  { value: "resolve", label: "Resolve" },
  { value: "dismiss", label: "Dismiss" },
  { value: "warn", label: "Warn" },
  { value: "suspend", label: "Suspend" },
  { value: "ban", label: "Ban" },
];

export function ModerationActionForm({ reportId }: Props) {
  const router = useRouter();
  const [actionType, setActionType] = useState("resolve");
  const [reasonCode, setReasonCode] = useState("reviewed");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actionType,
          reasonCode,
          notes: notes.trim() || undefined,
        }),
      });
      if (!response.ok) {
        setError("Action couldn't be applied. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Action couldn't be applied. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <select
          value={actionType}
          onChange={(event) => setActionType(event.target.value)}
          className="border-line text-ink rounded-lg border bg-white/70 p-2 text-sm dark:bg-white/[0.03]"
        >
          {ACTIONS.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
        <input
          value={reasonCode}
          onChange={(event) => setReasonCode(event.target.value)}
          placeholder="reason code"
          className="border-line text-ink rounded-lg border bg-white/70 p-2 text-sm dark:bg-white/[0.03]"
        />
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Restricted notes (staff only)"
        className="border-line text-ink w-full rounded-lg border bg-white/70 p-2 text-sm dark:bg-white/[0.03]"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending || reasonCode.trim().length === 0}>
        {pending ? "Applying…" : "Apply action"}
      </Button>
    </form>
  );
}
