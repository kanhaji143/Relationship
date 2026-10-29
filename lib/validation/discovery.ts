import { z } from "zod";

export const likeActionSchema = z.object({
  targetUid: z.string().trim().min(1).max(128),
  action: z.enum(["like", "pass"]),
});

export type LikeActionInput = z.infer<typeof likeActionSchema>;

export const matchIdSchema = z.string().trim().min(1).max(256);

export const discoveryFiltersSchema = z.object({
  limit: z.number().int().min(1).max(20).default(10),
  cursor: z.string().trim().max(256).optional(),
});

export type DiscoveryFiltersInput = z.infer<typeof discoveryFiltersSchema>;
