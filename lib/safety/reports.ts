/**
 * Report priority mapping (pure, unit-testable).
 *
 * Danger categories escalate to high priority so the moderation queue surfaces
 * them first. Unknown categories fall back to medium.
 */

export type ReportPriority = "low" | "medium" | "high";

const HIGH_PRIORITY = new Set(["minor_safety", "non_consensual_image", "threats"]);

const LOW_PRIORITY = new Set(["spam", "other"]);

export function reportPriority(category: string): ReportPriority {
  if (HIGH_PRIORITY.has(category)) return "high";
  if (LOW_PRIORITY.has(category)) return "low";
  return "medium";
}
