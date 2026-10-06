import { z } from "zod";

import { HUNGER_LEVELS, NO_PREFERENCE } from "@/lib/constants/find-my-dish";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";

const moodValues = MOOD_FILTERS.map((mood) => mood.value) as [string, ...string[]];
const hungerValues = HUNGER_LEVELS.map((level) => level.value) as [string, ...string[]];

/** An optional free-text preference: empty or the "no preference" sentinel both mean "skip". */
const optionalPreference = z
  .string()
  .trim()
  .max(80, "That answer is too long.")
  .optional()
  .transform((value) => (value && value !== NO_PREFERENCE ? value : undefined));

export const quizAnswersSchema = z.object({
  mood: z.enum(moodValues, { message: "Choose a mood." }),
  hunger: z.enum(hungerValues, { message: "Choose how hungry you are." }),
  spice: z.coerce
    .number()
    .int()
    .min(0, "Choose a spice level.")
    .max(5, "Choose a spice level."),
  flavor: optionalPreference,
  texture: optionalPreference,
  mealType: optionalPreference,
  occasion: optionalPreference,
});

export type QuizAnswersInput = z.infer<typeof quizAnswersSchema>;
