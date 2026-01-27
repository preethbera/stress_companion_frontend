import { z } from "zod";

export const profileSchema = z.object({
  identity: z.object({
    full_name: z.string().min(2, "Name is required"),
    age: z.coerce.number().min(13, "Must be at least 13"), // coerce handles string->number
    gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]),
    country: z.string().min(1, "Country is required"),
    primary_language: z.string().min(1, "Language is required"),
  }),
  demographics: z.object({
    education_level: z.enum(["high_school", "undergraduate", "postgraduate", "phd", "other"]),
    field_of_study: z.string().optional(),
    profession: z.string().optional(),
    current_role: z.enum(["student", "professional", "unemployed", "other"]),
    work_schedule: z.enum(["day", "night", "shift", "irregular"]),
  }),
  biometric: z.object({
    height_cm: z.coerce.number().positive(),
    weight_kg: z.coerce.number().positive(),
    skin_type: z.enum(["light", "medium", "dark", "very_dark"]).optional(),
    glasses: z.boolean().default(false),
  }),
  health_background: z.object({
    known_conditions: z.array(z.string()).default([]),
    current_medications: z.string().optional(), // Simplified to textarea string for easier editing
    resting_heart_rate: z.coerce.number().optional(),
    average_sleep_hours: z.coerce.number().min(0).max(24),
  }),
  lifestyle: z.object({
    physical_activity_level: z.enum(["low", "medium", "high"]),
    caffeine_intake: z.enum(["low", "medium", "high"]),
    smoking_status: z.enum(["never", "former", "current"]),
    alcohol_use: z.enum(["none", "occasional", "regular"]),
    daily_screen_time_hours: z.coerce.number().min(0).max(24),
    common_stress_domains: z.array(z.string()).default([]),
  }),
  psychological_traits: z.object({
    stress_sensitivity: z.enum(["low", "medium", "high"]),
    emotional_expressiveness: z.enum(["low", "medium", "high"]),
    coping_style: z.enum(["problem_focused", "emotion_focused", "avoidant"]),
    personality_scale: z.object({
      openness: z.array(z.number()).default([50]), // Using array for Shadcn Slider
      conscientiousness: z.array(z.number()).default([50]),
      extraversion: z.array(z.number()).default([50]),
      agreeableness: z.array(z.number()).default([50]),
      neuroticism: z.array(z.number()).default([50]),
    }),
  }),
});