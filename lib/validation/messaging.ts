import { z } from "zod";

/**
 * Phase 3 chat input rules.
 *
 * Text-only for now: attachments stay disabled until the private Storage
 * pipeline exists (R-118). Control characters are rejected rather than
 * stripped so stored bodies match exactly what the sender typed.
 */

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export const messageTextSchema = z
  .string()
  .trim()
  .min(1, "Write a message first.")
  .max(1000, "Keep messages under 1000 characters.")
  .refine((value) => !CONTROL_CHARACTERS.test(value), "Remove control characters.");

export const sendMessageSchema = z
  .object({
    text: messageTextSchema,
  })
  .strict();

export const conversationIdSchema = z.string().trim().min(1).max(256);

export const blockTargetSchema = z
  .object({
    targetUid: z.string().trim().min(1).max(128),
  })
  .strict();

export const reportSchema = z
  .object({
    targetUid: z.string().trim().min(1).max(128).optional(),
    conversationId: z.string().trim().min(1).max(256).optional(),
    category: z.enum([
      "spam",
      "harassment",
      "hate",
      "threats",
      "impersonation",
      "minor_safety",
      "non_consensual_image",
      "other",
    ]),
    description: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine((value) => value.targetUid !== undefined || value.conversationId !== undefined, {
    message: "Choose who or what you are reporting.",
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type BlockTargetInput = z.infer<typeof blockTargetSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
