/**
 * Discovery scoring — deterministic, pure ranking helpers.
 *
 * Weights follow the blueprint: compatibility 40%, interests 30%, values/prompts 20%,
 * freshness 10%. Scores are clamped to [0, 1].
 */

export type ScoreInputs = {
  sharedInterests: number;
  totalInterests: number;
  sharedLanguages: number;
  totalLanguages: number;
  sharedPromptAnswers: number;
  candidateAge: number;
  preferredAgeMidpoint: number;
  candidateCreatedAt: number;
  now: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function interestScore(shared: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(shared / total, 0, 1);
}

export function languageScore(shared: number, total: number): number {
  if (total <= 0) return 0;
  return clamp(shared / total, 0, 1);
}

export function promptScore(answerCount: number): number {
  // Three prompt answers is the maximum; scale linearly.
  return clamp(answerCount / 3, 0, 1);
}

export function ageProximityScore(candidateAge: number, preferredMidpoint: number): number {
  const distance = Math.abs(candidateAge - preferredMidpoint);
  return clamp(1 - distance / 15, 0, 1);
}

export function freshnessScore(createdAt: number, now: number): number {
  const ageDays = Math.max(0, (now - createdAt) / (1000 * 60 * 60 * 24));
  // Freshness declines linearly and reaches 0 at 90 days.
  return clamp(1 - ageDays / 90, 0, 1);
}

export function compatibilityScore(inputs: ScoreInputs): number {
  const interests = interestScore(inputs.sharedInterests, inputs.totalInterests);
  const languages = languageScore(inputs.sharedLanguages, inputs.totalLanguages);
  const prompts = promptScore(inputs.sharedPromptAnswers);
  const age = ageProximityScore(inputs.candidateAge, inputs.preferredAgeMidpoint);
  const freshness = freshnessScore(inputs.candidateCreatedAt, inputs.now);

  // Compatibility blends intent/age/region/language affinity.
  const compatibility = (age + languages) / 2;
  const score = compatibility * 0.4 + interests * 0.3 + prompts * 0.2 + freshness * 0.1;
  return Math.round(clamp(score, 0, 1) * 1000) / 1000;
}
