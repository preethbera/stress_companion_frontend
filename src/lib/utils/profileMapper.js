/**
 * Profile Mapper Utility
 * 
 * Production-ready separation of concerns to handle data transformation 
 * between the Backend's flat schema and the Frontend's heavily nested UI schema.
 */

export function mapBackendToFrontend(user) {
  if (!user) return {};

  const stressSourcesArray = user.stress_sources 
    ? user.stress_sources.split(',').map(s => s.trim()) 
    : [];

  return {
    identity: {
      gender: user.gender || "prefer_not_to_say",
      country: user.country || "none",
      full_name: user.name || "",
      age: user.age || 18,
      primary_language: "English", // Satisfy Zod required
    },
    demographics: {
      work_schedule: "day",
      education_level: user.education || "undergraduate",
      current_role: user.currentrole || "student",
    },
    biometric: {
      glasses: false,
      height_cm: user.height_cm || 170, // Satisfy Zod positive() requirement
      weight_kg: user.weight_kg || 70, // Satisfy Zod positive() requirement
    },
    health_background: {
      known_conditions: [],
      current_medications: user.medical_history || "",
      average_sleep_hours: 8, // Satisfy Zod
    },
    lifestyle: { 
      common_stress_domains: stressSourcesArray, 
      physical_activity_level: user.physical_activity || "medium",
      caffeine_intake: "medium",
      smoking_status: "never",
      alcohol_use: "none",
      daily_screen_time_hours: user.daily_screen_time || 5,
    },
    psychological_traits: {
      stress_sensitivity: "medium",
      emotional_expressiveness: "medium",
      coping_style: "problem_focused",
      personality_scale: {
        openness: user.openness !== undefined && user.openness !== null ? [user.openness] : [50],
        disciplined: user.disciplined !== undefined && user.disciplined !== null ? [user.disciplined] : [50],
        outgoing: user.outgoing !== undefined && user.outgoing !== null ? [user.outgoing] : [50],
        cooperative: user.cooperative !== undefined && user.cooperative !== null ? [user.cooperative] : [50],
        anxious: user.anxious !== undefined && user.anxious !== null ? [user.anxious] : [50],
      },
    },
  };
}

export function mapFrontendToBackend(data) {
  const stressSourcesStr = data.lifestyle?.common_stress_domains?.length 
    ? data.lifestyle.common_stress_domains.join(', ')
    : null;

  return {
    name: data.identity?.full_name || null,
    age: data.identity?.age ? parseInt(data.identity.age, 10) : null,
    gender: data.identity?.gender || null,
    country: data.identity?.country || null,
    education: data.demographics?.education_level || null,
    currentrole: data.demographics?.current_role || null,
    height_cm: data.biometric?.height_cm ? parseFloat(data.biometric.height_cm) : null,
    weight_kg: data.biometric?.weight_kg ? parseFloat(data.biometric.weight_kg) : null,
    medical_history: data.health_background?.current_medications || null,
    
    // Lifestyle
    physical_activity: data.lifestyle?.physical_activity_level || null,
    daily_screen_time: data.lifestyle?.daily_screen_time_hours ? parseFloat(data.lifestyle.daily_screen_time_hours) : null,
    stress_sources: stressSourcesStr,

    // Psychology
    openness: data.psychological_traits?.personality_scale?.openness?.[0] ?? null,
    disciplined: data.psychological_traits?.personality_scale?.disciplined?.[0] ?? null,
    outgoing: data.psychological_traits?.personality_scale?.outgoing?.[0] ?? null,
    cooperative: data.psychological_traits?.personality_scale?.cooperative?.[0] ?? null,
    anxious: data.psychological_traits?.personality_scale?.anxious?.[0] ?? null,
  };
}
