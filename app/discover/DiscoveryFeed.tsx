"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

type DiscoveryCandidate = {
  uid: string;
  displayName: string;
  bio: string;
  broadLocationLabel: string;
  languages: string[];
  interestIds: string[];
  intent: "serious" | "casual";
  age: number;
  score: number;
};

type CandidateResponse = { candidates: DiscoveryCandidate[] };

function getErrorMessage(code: string | undefined): string {
  switch (code) {
    case "onboarding_required":
    case "profile_incomplete":
      return "Complete your profile before discovering people.";
    case "profile_review_required":
      return "Your profile is under review. Discovery will start when it is approved.";
    case "account_unavailable":
      return "Discovery is unavailable for this account right now.";
    case "adult_eligibility_required":
      return "Discovery is available only to eligible adults (18+).";
    case "rate_limited":
      return "Discovery is temporarily limited. Please try again later.";
    default:
      return "We couldn't load discovery right now. Please try again.";
  }
}

function isCandidateResponse(value: unknown): value is CandidateResponse {
  if (value === null || typeof value !== "object" || !("candidates" in value)) return false;
  const candidates = value.candidates;
  return (
    Array.isArray(candidates) &&
    candidates.every(
      (candidate) =>
        candidate !== null &&
        typeof candidate === "object" &&
        typeof candidate.uid === "string" &&
        typeof candidate.displayName === "string" &&
        typeof candidate.bio === "string" &&
        typeof candidate.broadLocationLabel === "string" &&
        Array.isArray(candidate.languages) &&
        Array.isArray(candidate.interestIds) &&
        (candidate.intent === "serious" || candidate.intent === "casual") &&
        typeof candidate.age === "number" &&
        typeof candidate.score === "number",
    )
  );
}

async function requestCandidates(): Promise<DiscoveryCandidate[]> {
  const response = await fetch("/api/discover/candidates", { cache: "no-store" });
  const body: unknown = await response.json();
  if (!response.ok) {
    const code =
      body !== null && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : undefined;
    throw new Error(code ?? "discovery_unavailable");
  }
  if (!isCandidateResponse(body)) throw new Error("discovery_unavailable");
  return body.candidates;
}

export function DiscoveryFeed() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      setCandidates(await requestCandidates());
    } catch (caught) {
      setError(getErrorMessage(caught instanceof Error ? caught.message : undefined));
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void requestCandidates()
      .then((loadedCandidates) => {
        if (!cancelled) setCandidates(loadedCandidates);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(caught instanceof Error ? caught.message : undefined));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function recordAction(candidate: DiscoveryCandidate, action: "like" | "pass") {
    setPendingUid(candidate.uid);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/discover/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetUid: candidate.uid, action }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const code =
          body !== null &&
          typeof body === "object" &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : undefined;
        if (code === "target_not_found") {
          setCandidates((current) => current.filter((item) => item.uid !== candidate.uid));
          setNotice("This profile is no longer available.");
        } else if (code === "rate_limited") {
          setError("You have reached the action limit. Please try again later.");
        } else {
          setError("Your action couldn't be saved. Please try again.");
        }
        return;
      }

      const result = body as { matched?: unknown; status?: unknown };
      setCandidates((current) => current.filter((item) => item.uid !== candidate.uid));
      setNotice(
        result.status === "already_matched"
          ? "You already have a match. Find it in Matches."
          : result.matched === true
            ? "It's a mutual match. You can find it in Matches."
            : action === "like"
              ? "Like sent."
              : "Profile passed.",
      );
    } catch {
      setError("Your action couldn't be saved. Please try again.");
    } finally {
      setPendingUid(null);
    }
  }

  if (loading) {
    return (
      <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
        <p role="status" className="text-ink-muted text-sm">
          Finding people who fit your preferences…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}

      {candidates.length === 0 ? (
        <div className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]">
          <h2 className="text-ink text-lg font-semibold">No one new to show right now</h2>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            Your discovery settings and safety exclusions are applied. Try again later or adjust
            your broad preferences.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void loadCandidates()}>
              Try again
            </Button>
            <Link
              href="/settings/discovery"
              className="border-line text-ink hover:border-brand inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Review filters
            </Link>
          </div>
        </div>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.uid}
            className="border-line rounded-2xl border bg-white/70 p-6 shadow-sm sm:p-8 dark:bg-white/[0.03]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-ink text-2xl font-semibold tracking-tight">
                  {candidate.displayName}, {candidate.age}
                </h2>
                <p className="text-ink-muted mt-1 text-sm">{candidate.broadLocationLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-accent-soft text-accent rounded-full px-3 py-1 text-xs font-semibold">
                  {candidate.intent === "serious" ? "Serious relationship" : "Casual dating"}
                </span>
                <span className="border-line text-ink-muted rounded-full border px-3 py-1 text-xs">
                  Preference ranking {Math.round(candidate.score * 100)}/100
                </span>
              </div>
            </div>

            {candidate.bio ? (
              <p className="text-ink mt-5 text-sm leading-relaxed whitespace-pre-wrap">
                {candidate.bio}
              </p>
            ) : null}

            {candidate.interestIds.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
                  Interests
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {candidate.interestIds.map((interest) => (
                    <li
                      key={interest}
                      className="border-line text-ink-muted rounded-full border px-3 py-1 text-xs"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {candidate.languages.length > 0 ? (
              <p className="text-ink-muted mt-4 text-xs">
                Languages: {candidate.languages.join(", ")}
              </p>
            ) : null}

            <div className="border-line/70 mt-6 flex flex-wrap gap-3 border-t pt-5">
              <Button
                variant="secondary"
                disabled={pendingUid !== null}
                onClick={() => void recordAction(candidate, "pass")}
                aria-label={`Pass on ${candidate.displayName}`}
              >
                Pass
              </Button>
              <Button
                disabled={pendingUid !== null}
                onClick={() => void recordAction(candidate, "like")}
                aria-label={`Like ${candidate.displayName}`}
              >
                {pendingUid === candidate.uid ? "Saving…" : "Like"}
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
