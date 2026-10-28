import type { ProfilePromptKey } from "@/lib/config/prompts";

/** Safe owner-only values passed from the server data layer to the editor. */
export type PromptAnswerDTO = {
  promptKey: ProfilePromptKey;
  promptText: string;
  responseText: string;
};
