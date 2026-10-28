import { z } from "zod";

import { PROFILE_PROMPT_KEYS } from "@/lib/config/prompts";

const allowedPromptKey = z
  .string()
  .refine(
    (key) => (PROFILE_PROMPT_KEYS as readonly string[]).includes(key),
    "Choose a prompt from the list.",
  );

const promptResponseSchema = z
  .string()
  .trim()
  .min(20, "Use at least 20 characters.")
  .max(240, "Keep each answer under 240 characters.")
  .refine(
    (text) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/.test(text),
    "Remove markup and control characters.",
  )
  .refine(
    (text) => !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text),
    "Do not include email addresses in profile answers.",
  )
  .refine(
    (text) => !/(?:\+?\d[\d\s().-]{8,}\d)/.test(text),
    "Do not include phone numbers in profile answers.",
  );

export const promptAnswersSchema = z
  .object({
    answers: z
      .array(
        z.object({
          promptKey: allowedPromptKey,
          responseText: promptResponseSchema,
        }),
      )
      .max(3, "Choose up to three prompts."),
  })
  .superRefine(({ answers }, context) => {
    const keys = answers.map((answer) => answer.promptKey);
    if (new Set(keys).size !== keys.length) {
      context.addIssue({
        code: "custom",
        path: ["answers"],
        message: "Each prompt can only be answered once.",
      });
    }
  });

export type PromptAnswersInput = z.infer<typeof promptAnswersSchema>;
