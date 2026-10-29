import { z } from "zod";

export const moderationActionSchema = z
  .object({
    actionType: z.enum(["warn", "suspend", "ban", "dismiss", "resolve"]),
    reasonCode: z.string().trim().min(1).max(100),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
