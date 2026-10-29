import { z } from "zod";

export const privacySettingsSchema = z
  .object({
    profileVisibility: z.enum(["visible", "hidden"]),
    discoveryPaused: z.boolean(),
    showOnlineStatus: z.boolean(),
    allowMessageRequests: z.boolean(),
  })
  .strict();

export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
