import { z } from "zod";

export const settingsSchema = z.object({
  appearance: z.object({
    theme_mode: z.enum(["light", "dark", "system"]),
  }),
  conversational_preferences: z.object({
    preferred_name_in_chat: z.string().optional(),
    tone: z.enum(["formal", "friendly", "supportive"]),
    response_length: z.enum(["short", "medium", "detailed"]),
    feedback_style: z.enum(["direct", "gentle"]),
    topics_to_avoid: z.array(z.string()).default([]),
  }),
  privacy_and_consent: z.object({
    enable_facial_analysis: z.boolean(),
    enable_thermal_imaging: z.boolean(),
    allow_biometric_storage: z.boolean(),
    allow_model_training_use: z.boolean(),
    allow_long_term_tracking: z.boolean(),
  }),
  data_retention: z.object({
    retention_policy: z.enum(["session_only", "days", "indefinite"]),
    retention_days: z.coerce.number().min(0).optional(),
    auto_delete_enabled: z.boolean(),
  }),
  regional: z.object({
    timezone: z.string(),
    date_format: z.string(),
    time_format: z.enum(["12h", "24h"]),
    language: z.string(),
  }),
});