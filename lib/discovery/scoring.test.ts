import { describe, expect, it } from "vitest";

import {
  ageProximityScore,
  compatibilityScore,
  freshnessScore,
  interestScore,
  languageScore,
  promptScore,
} from "./scoring";

describe("interestScore", () => {
  it("returns 1 for full overlap", () => {
    expect(interestScore(3, 3)).toBe(1);
  });
  it("returns 0.5 for half overlap", () => {
    expect(interestScore(1, 2)).toBe(0.5);
  });
  it("returns 0 for no overlap or empty total", () => {
    expect(interestScore(0, 3)).toBe(0);
    expect(interestScore(0, 0)).toBe(0);
  });
});

describe("languageScore", () => {
  it("scores shared/total", () => {
    expect(languageScore(1, 2)).toBe(0.5);
    expect(languageScore(0, 0)).toBe(0);
  });
});

describe("promptScore", () => {
  it("scales to 3 answers", () => {
    expect(promptScore(0)).toBe(0);
    expect(promptScore(3)).toBe(1);
    expect(promptScore(2)).toBeCloseTo(0.667, 3);
  });
});

describe("ageProximityScore", () => {
  it("returns 1 at exact match", () => {
    expect(ageProximityScore(30, 30)).toBe(1);
  });
  it("decays with distance", () => {
    expect(ageProximityScore(45, 30)).toBe(0);
    expect(ageProximityScore(37, 30)).toBeCloseTo(0.533, 3);
  });
});

describe("freshnessScore", () => {
  it("is 1 for brand-new profiles", () => {
    expect(freshnessScore(1000, 1000)).toBe(1);
  });
  it("decays to 0 at 90 days", () => {
    const now = 1000;
    const createdAt = now - 90 * 24 * 60 * 60 * 1000;
    expect(freshnessScore(createdAt, now)).toBe(0);
  });
  it("decays linearly", () => {
    const now = 90 * 24 * 60 * 60 * 1000;
    expect(freshnessScore(now - 45 * 24 * 60 * 60 * 1000, now)).toBe(0.5);
  });
});

describe("compatibilityScore", () => {
  it("applies the documented 40/30/20/10 weights", () => {
    const now = 100 * 24 * 60 * 60 * 1000;
    expect(
      compatibilityScore({
        sharedInterests: 1,
        totalInterests: 2,
        sharedLanguages: 1,
        totalLanguages: 2,
        sharedPromptAnswers: 1,
        candidateAge: 30,
        preferredAgeMidpoint: 30,
        candidateCreatedAt: now - 45 * 24 * 60 * 60 * 1000,
        now,
      }),
    ).toBe(0.567);
  });

  it("stays within [0, 1]", () => {
    const score = compatibilityScore({
      sharedInterests: 3,
      totalInterests: 3,
      sharedLanguages: 2,
      totalLanguages: 2,
      sharedPromptAnswers: 3,
      candidateAge: 30,
      preferredAgeMidpoint: 30,
      candidateCreatedAt: Date.now(),
      now: Date.now(),
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("rewards better matches", () => {
    const good = compatibilityScore({
      sharedInterests: 3,
      totalInterests: 3,
      sharedLanguages: 2,
      totalLanguages: 2,
      sharedPromptAnswers: 3,
      candidateAge: 30,
      preferredAgeMidpoint: 30,
      candidateCreatedAt: Date.now(),
      now: Date.now(),
    });
    const bad = compatibilityScore({
      sharedInterests: 0,
      totalInterests: 3,
      sharedLanguages: 0,
      totalLanguages: 2,
      sharedPromptAnswers: 0,
      candidateAge: 60,
      preferredAgeMidpoint: 30,
      candidateCreatedAt: Date.now() - 80 * 24 * 60 * 60 * 1000,
      now: Date.now(),
    });
    expect(good).toBeGreaterThan(bad);
  });
});
