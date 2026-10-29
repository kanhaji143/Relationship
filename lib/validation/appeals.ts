import { z } from "zod";

export const appealSchema = z
  .object({
    targetType: z.enum(["moderation_action", "report"]),
    targetId: z.string().trim().min(1).max(256),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();

export const appealResolutionSchema = z
  .object({
    status: z.enum(["resolved", "dismissed"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export type AppealInput = z.infer<typeof appealSchema>;
export type AppealResolutionInput = z.infer<typeof appealResolutionSchema>;
