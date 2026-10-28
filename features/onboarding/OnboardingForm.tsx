"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { INTERESTS, LANGUAGES, REGIONS, type RegionId } from "@/lib/config/onboarding";
import type { OnboardingDraft } from "@/features/onboarding/types";
import { onboardingSchema } from "@/lib/validation/onboarding";

export function OnboardingForm({ initialData }: { initialData: OnboardingDraft | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? "");
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "");
  const [intent, setIntent] = useState<"serious" | "casual">(initialData?.intent ?? "serious");
  const [region, setRegion] = useState<RegionId | "">(initialData?.region ?? "");
  const [languages, setLanguages] = useState<string[]>(initialData?.languages ?? ["en-IN"]);
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [interestIds, setInterestIds] = useState<string[]>(initialData?.interestIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = onboardingSchema.safeParse({
      displayName,
      birthDate,
      intent,
      region: region || null,
      languages,
      bio,
      interestIds,
      countryCode: "IN",
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
        credentials: "same-origin",
      });

      if (response.ok) {
        router.replace("/account");
        router.refresh();
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        setError("You must be at least 18 years old to use this platform.");
        return;
      }
      if (response.status === 429) {
        setError("Too many saves. Please wait a few minutes and try again.");
        return;
      }
      if (response.status === 400) {
        const payload = (await response.json().catch(() => null)) as {
          fields?: { message?: string }[];
        } | null;
        setError(payload?.fields?.[0]?.message ?? "Check your details and try again.");
        return;
      }
      setError("We could not save your profile. Please try again.");
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="flex flex-col gap-5" aria-labelledby="onboarding-basics">
        <div>
          <h2 id="onboarding-basics" className="text-ink text-lg font-semibold">
            Basics
          </h2>
          <p className="text-ink-muted mt-1 text-sm">
            Your birth date is never shown on your profile — only your age band can be derived.
          </p>
        </div>

        <Field
          id="onboarding-name"
          label="Display name"
          name="displayName"
          autoComplete="nickname"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          hint="2–40 characters. This is what others see."
        />

        <Field
          id="onboarding-birth-date"
          label="Date of birth"
          type="date"
          name="birthDate"
          autoComplete="bday"
          required
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          hint="You must be 18 or older."
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-ink text-sm font-medium">What are you here for?</legend>
          <label className="border-line flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <input
              type="radio"
              name="intent"
              value="serious"
              className="mt-1"
              checked={intent === "serious"}
              onChange={() => setIntent("serious")}
            />
            <span>
              <span className="text-ink block text-sm font-medium">Serious relationship</span>
              <span className="text-ink-muted mt-0.5 block text-sm">
                Looking for a committed, long-term relationship.
              </span>
            </span>
          </label>
          <label className="border-line flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <input
              type="radio"
              name="intent"
              value="casual"
              className="mt-1"
              checked={intent === "casual"}
              onChange={() => setIntent("casual")}
            />
            <span>
              <span className="text-ink block text-sm font-medium">Casual dating</span>
              <span className="text-ink-muted mt-0.5 block text-sm">
                Consensual, honest casual dating. Never misrepresented.
              </span>
            </span>
          </label>
        </fieldset>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="onboarding-location">
        <div>
          <h2 id="onboarding-location" className="text-ink text-lg font-semibold">
            Location &amp; languages
          </h2>
          <p className="text-ink-muted mt-1 text-sm">
            We show a broad region only. No precise location tracking.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-region" className="text-ink text-sm font-medium">
            Broad region (optional)
          </label>
          <select
            id="onboarding-region"
            name="region"
            className="border-line text-ink min-h-11 rounded-lg border bg-white px-3.5 py-2.5 text-base dark:bg-white/[0.04]"
            value={region}
            onChange={(event) => setRegion(event.target.value as RegionId | "")}
          >
            <option value="">Prefer not to say</option>
            {REGIONS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-ink text-sm font-medium">Languages you speak</legend>
          <p className="text-ink-muted text-xs">Choose 1–4.</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((language) => (
              <label
                key={language.code}
                className="border-line flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-brand)]"
                  checked={languages.includes(language.code)}
                  onChange={() => setLanguages((current) => toggle(current, language.code))}
                />
                {language.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="onboarding-about">
        <div>
          <h2 id="onboarding-about" className="text-ink text-lg font-semibold">
            About you
          </h2>
          <p className="text-ink-muted mt-1 text-sm">
            No contact details, exact address or financial information, please.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-bio" className="text-ink text-sm font-medium">
            Short bio (optional)
          </label>
          <textarea
            id="onboarding-bio"
            name="bio"
            rows={4}
            maxLength={300}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="border-line text-ink rounded-lg border bg-white px-3.5 py-2.5 text-base dark:bg-white/[0.04]"
          />
          <p className="text-ink-muted text-xs">{bio.length}/300 characters</p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-ink text-sm font-medium">Interests</legend>
          <p className="text-ink-muted text-xs">Choose 3–8. Selected: {interestIds.length}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTERESTS.map((interest) => {
              const checked = interestIds.includes(interest.id);
              const atLimit = interestIds.length >= 8 && !checked;
              return (
                <label
                  key={interest.id}
                  className={`border-line flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    atLimit ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-brand)]"
                    checked={checked}
                    disabled={atLimit}
                    onChange={() => setInterestIds((current) => toggle(current, interest.id))}
                  />
                  {interest.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving profile…" : "Save profile"}
        </Button>
        <p className="text-ink-muted text-xs">
          Photos and prompt answers arrive in the next slice. You can edit these details later.
        </p>
      </div>
    </form>
  );
}
