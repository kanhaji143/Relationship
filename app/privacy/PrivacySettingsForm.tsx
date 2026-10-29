"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { PrivacySettings } from "@/lib/privacy/server";

type Props = {
  initialSettings: PrivacySettings;
};

export function PrivacySettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState<"export" | "delete" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/me/privacy", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        setError("Your privacy settings couldn't be saved.");
        return;
      }
      setNotice("Privacy settings saved.");
      router.refresh();
    } catch {
      setError("Your privacy settings couldn't be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function requestExport() {
    setRequesting("export");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/privacy/export", { method: "POST" });
      if (!response.ok) {
        setError("The export request couldn't be created.");
        return;
      }
      setNotice("Data export requested. We'll prepare it within 30 days.");
    } catch {
      setError("The export request couldn't be created.");
    } finally {
      setRequesting(null);
    }
  }

  async function requestDelete() {
    setRequesting("delete");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/privacy/delete", { method: "POST" });
      if (!response.ok) {
        setError("The deletion request couldn't be created.");
        return;
      }
      setNotice("Account deletion requested. We'll process it within 30 days.");
    } catch {
      setError("The deletion request couldn't be created.");
    } finally {
      setRequesting(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">Privacy</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight">Privacy center</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Control your visibility and data. Changes apply immediately.
        </p>
      </header>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      <section className="border-line space-y-4 rounded-2xl border bg-white/70 p-5 dark:bg-white/[0.03]">
        <label className="flex items-center justify-between gap-3">
          <span className="text-ink text-sm font-medium">Profile visibility</span>
          <select
            value={settings.profileVisibility}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                profileVisibility: event.target.value as "visible" | "hidden",
              }))
            }
            className="border-line text-ink rounded-lg border bg-white/70 p-2 text-sm dark:bg-white/[0.03]"
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-ink text-sm font-medium">Pause discovery</span>
          <input
            type="checkbox"
            checked={settings.discoveryPaused}
            onChange={(event) =>
              setSettings((current) => ({ ...current, discoveryPaused: event.target.checked }))
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-ink text-sm font-medium">Show online status</span>
          <input
            type="checkbox"
            checked={settings.showOnlineStatus}
            onChange={(event) =>
              setSettings((current) => ({ ...current, showOnlineStatus: event.target.checked }))
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-ink text-sm font-medium">Allow message requests</span>
          <input
            type="checkbox"
            checked={settings.allowMessageRequests}
            onChange={(event) =>
              setSettings((current) => ({ ...current, allowMessageRequests: event.target.checked }))
            }
          />
        </label>

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save privacy settings"}
        </Button>
      </section>

      <section className="border-line space-y-3 rounded-2xl border bg-white/70 p-5 dark:bg-white/[0.03]">
        <h2 className="text-ink text-lg font-semibold">Your data</h2>
        <p className="text-ink-muted text-sm">
          Request an export or deletion. We process these within 30 days.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => void requestExport()}
            disabled={requesting !== null}
          >
            {requesting === "export" ? "Requesting…" : "Request data export"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void requestDelete()}
            disabled={requesting !== null}
          >
            {requesting === "delete" ? "Requesting…" : "Request account deletion"}
          </Button>
        </div>
      </section>
    </div>
  );
}
