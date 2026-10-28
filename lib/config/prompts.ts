/** Approved, non-sensitive profile prompts. Prompt keys are stable data ids. */
export const PROFILE_PROMPTS = [
  { key: "small_joy", text: "What small thing reliably makes your day better?" },
  { key: "curiosity", text: "What is something you are curious to learn?" },
  { key: "ideal_weekend", text: "What does a good weekend look like for you?" },
  { key: "conversation", text: "What kind of conversation do you enjoy most?" },
  { key: "shared_values", text: "What value matters most in a relationship?" },
  { key: "quiet_evening", text: "How do you like to spend a quiet evening?" },
  { key: "meaningful_memory", text: "What is a moment you still smile about?" },
  { key: "try_together", text: "What is something new you would enjoy trying together?" },
] as const;

export type ProfilePromptKey = (typeof PROFILE_PROMPTS)[number]["key"];
export const PROFILE_PROMPT_KEYS: readonly ProfilePromptKey[] = PROFILE_PROMPTS.map(
  (prompt) => prompt.key,
);

export function promptLabel(key: string): string {
  return PROFILE_PROMPTS.find((prompt) => prompt.key === key)?.text ?? "Profile prompt";
}
