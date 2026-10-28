"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PROFILE_PROMPTS, type ProfilePromptKey } from "@/lib/config/prompts";
import { promptAnswersSchema } from "@/lib/validation/prompts";
import type { PromptAnswerDTO } from "@/features/prompts/types";

export function PromptEditor({ initialAnswers }: { initialAnswers: PromptAnswerDTO[] }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function addAnswer() {
    const nextPrompt = PROFILE_PROMPTS.find(
      (prompt) => !answers.some((answer) => answer.promptKey === prompt.key),
    );
    if (!nextPrompt || answers.length >= 3) return;
    setAnswers((current) => [
      ...current,
      { promptKey: nextPrompt.key, promptText: nextPrompt.text, responseText: "" },
    ]);
    setSaved(false);
    setError(null);
  }

  function updateAnswer(index: number, update: Partial<PromptAnswerDTO>) {
    setAnswers((current) =>
      current.map((answer, i) => (i === index ? { ...answer, ...update } : answer)),
    );
    setSaved(false);
  }

  function removeAnswer(index: number) {
    setAnswers((current) => current.filter((_, i) => i !== index));
    setSaved(false);
    setError(null);
  }

  async function save() {
    setError(null);
    setSaved(false);
    const parsed = promptAnswersSchema.safeParse({
      answers: answers.map(({ promptKey, responseText }) => ({ promptKey, responseText })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your prompt answers.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile/prompts", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        setSaved(true);
        return;
      }
      if (response.status === 401) {
        setError("Your session ended. Sign in again to save.");
      } else if (response.status === 403) {
        setError("This save was rejected. Refresh and try again.");
      } else if (response.status === 429) {
        setError("Too many saves. Wait a few minutes and try again.");
      } else {
        const result = (await response.json().catch(() => null)) as {
          fields?: { message?: string }[];
        } | null;
        setError(result?.fields?.[0]?.message ?? "We could not save your answers.");
      }
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-ink-muted text-sm leading-relaxed">
        Answer up to three. Keep it about you—don’t include contact details or sensitive
        information. Answers are reviewed before they appear to others.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Your prompt answers are saved.</Alert> : null}

      {answers.map((answer, index) => (
        <fieldset
          key={`${answer.promptKey}-${index}`}
          className="border-line rounded-xl border p-4"
        >
          <legend className="text-ink px-1 text-sm font-semibold">Prompt {index + 1}</legend>
          <label
            htmlFor={`prompt-key-${index}`}
            className="text-ink mt-2 block text-sm font-medium"
          >
            Choose a prompt
          </label>
          <select
            id={`prompt-key-${index}`}
            value={answer.promptKey}
            onChange={(event) => {
              const promptKey = event.target.value as ProfilePromptKey;
              const promptText =
                PROFILE_PROMPTS.find((prompt) => prompt.key === promptKey)?.text ?? "";
              updateAnswer(index, { promptKey, promptText });
            }}
            className="border-line text-ink mt-1 min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-white/[0.04]"
          >
            {PROFILE_PROMPTS.map((prompt) => {
              const selectedElsewhere = answers.some(
                (other, otherIndex) => otherIndex !== index && other.promptKey === prompt.key,
              );
              return (
                <option key={prompt.key} value={prompt.key} disabled={selectedElsewhere}>
                  {prompt.text}
                </option>
              );
            })}
          </select>

          <label
            htmlFor={`prompt-answer-${index}`}
            className="text-ink mt-4 block text-sm font-medium"
          >
            Your answer
          </label>
          <textarea
            id={`prompt-answer-${index}`}
            rows={3}
            maxLength={240}
            value={answer.responseText}
            onChange={(event) => updateAnswer(index, { responseText: event.target.value })}
            className="border-line text-ink mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-base dark:bg-white/[0.04]"
            aria-describedby={`prompt-count-${index}`}
          />
          <div className="text-ink-muted mt-1 flex items-center justify-between text-xs">
            <span id={`prompt-count-${index}`}>{answer.responseText.length}/240 characters</span>
            <button
              type="button"
              onClick={() => removeAnswer(index)}
              className="text-brand-strong font-medium underline"
              aria-label={`Remove prompt ${index + 1}`}
            >
              Remove
            </button>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={addAnswer} disabled={answers.length >= 3}>
          Add a prompt
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save answers"}
        </Button>
      </div>
      <p className="text-ink-muted text-xs">
        Remove all answers and save to clear your prompts. They remain hidden until reviewed.
      </p>
    </div>
  );
}
