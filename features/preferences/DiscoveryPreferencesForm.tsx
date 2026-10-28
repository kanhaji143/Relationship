"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LANGUAGES, REGIONS } from "@/lib/config/onboarding";
import {
  discoveryPreferencesSchema,
  type DiscoveryPreferencesDraft,
} from "@/lib/validation/discovery-preferences";

const INTENTS = [
  { value: "serious", label: "Serious relationship" },
  { value: "casual", label: "Casual dating" },
] as const;

export function DiscoveryPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: DiscoveryPreferencesDraft;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggle<T extends string>(values: T[], value: T): T[] {
    return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
  }

  async function save() {
    setError(null);
    setSaved(false);
    const parsed = discoveryPreferencesSchema.safeParse(preferences);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your discovery preferences.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/preferences/discovery", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        setSaved(true);
        return;
      }
      if (response.status === 401) setError("Your session ended. Sign in again to save.");
      else if (response.status === 403) setError("This save was rejected. Refresh and try again.");
      else if (response.status === 429)
        setError("Too many saves. Wait a few minutes and try again.");
      else {
        const result = (await response.json().catch(() => null)) as {
          fields?: { message?: string }[];
        } | null;
        setError(result?.fields?.[0]?.message ?? "We could not save your preferences.");
      }
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <p className="text-ink-muted text-sm leading-relaxed">
        These are filters for people you may discover. They do not change the relationship intent on
        your own profile. Location choices stay broad; no GPS or exact distance is collected here.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Your discovery preferences are saved.</Alert> : null}

      <section aria-labelledby="age-range-heading">
        <h2 id="age-range-heading" className="text-ink font-semibold">
          Age range
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="age-min" className="text-ink text-sm font-medium">
              Minimum age
            </label>
            <input
              id="age-min"
              type="number"
              min={18}
              max={99}
              value={preferences.ageMin}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, ageMin: Number(event.target.value) }))
              }
              className="border-line text-ink min-h-11 rounded-lg border bg-white px-3 dark:bg-white/[0.04]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="age-max" className="text-ink text-sm font-medium">
              Maximum age
            </label>
            <input
              id="age-max"
              type="number"
              min={18}
              max={99}
              value={preferences.ageMax}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, ageMax: Number(event.target.value) }))
              }
              className="border-line text-ink min-h-11 rounded-lg border bg-white px-3 dark:bg-white/[0.04]"
            />
          </div>
        </div>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-ink font-semibold">Compatible relationship intents</legend>
        <p className="text-ink-muted text-xs">
          Choose one or both. Only matching intents will be considered.
        </p>
        {INTENTS.map((intent) => (
          <label key={intent.value} className="text-ink-muted flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-brand)]"
              checked={preferences.desiredIntents.includes(intent.value)}
              onChange={() =>
                setPreferences((current) => ({
                  ...current,
                  desiredIntents: toggle([...current.desiredIntents], intent.value),
                }))
              }
            />
            {intent.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-ink font-semibold">Broad regions (optional)</legend>
        <p className="text-ink-muted text-xs">Leave empty to include all regions in India.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REGIONS.map((region) => (
            <label
              key={region.id}
              className="border-line flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-brand)]"
                checked={preferences.preferredRegions.includes(region.id)}
                onChange={() =>
                  setPreferences((current) => ({
                    ...current,
                    preferredRegions: toggle([...current.preferredRegions], region.id),
                  }))
                }
              />
              {region.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-ink font-semibold">Languages (optional)</legend>
        <p className="text-ink-muted text-xs">Leave empty to include all listed languages.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((language) => (
            <label
              key={language.code}
              className="border-line flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-brand)]"
                checked={preferences.preferredLanguages.includes(language.code)}
                onChange={() =>
                  setPreferences((current) => ({
                    ...current,
                    preferredLanguages: toggle([...current.preferredLanguages], language.code),
                  }))
                }
              />
              {language.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="border-line flex items-start gap-3 rounded-xl border p-4">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--color-brand)]"
          checked={preferences.discoveryPaused}
          onChange={(event) =>
            setPreferences((current) => ({ ...current, discoveryPaused: event.target.checked }))
          }
        />
        <span>
          <span className="text-ink block text-sm font-semibold">Pause discovery</span>
          <span className="text-ink-muted mt-1 block text-sm">
            Hide me from new discovery suggestions until I turn this off.
          </span>
        </span>
      </label>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}
