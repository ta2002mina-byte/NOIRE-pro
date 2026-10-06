"use server";

import { readString, toFieldErrors, type FieldErrors } from "@/lib/actions/state";
import { getAuthContext } from "@/lib/auth/session";
import { getMenuItems, type MenuItemWithExtras } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";
import { findDishMatch, type QuizAnswers } from "@/lib/recommendations/find-my-dish";
import { createClient } from "@/lib/supabase/server";
import { quizAnswersSchema } from "@/lib/validations/find-my-dish";

export type FindMyDishResult =
  | { matched: true; dish: MenuItemWithExtras; reasons: string[] }
  | { matched: false };

export interface FindMyDishState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  result?: FindMyDishResult;
  saved?: boolean;
}

export const initialFindMyDishState: FindMyDishState = { status: "idle" };

export async function findMyDishAction(
  _previous: FindMyDishState,
  formData: FormData,
): Promise<FindMyDishState> {
  const parsed = quizAnswersSchema.safeParse({
    mood: readString(formData, "mood"),
    hunger: readString(formData, "hunger"),
    spice: readString(formData, "spice"),
    flavor: readString(formData, "flavor"),
    texture: readString(formData, "texture"),
    mealType: readString(formData, "mealType"),
    occasion: readString(formData, "occasion"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Check your answers and try again.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const restaurant = await getRestaurant();
  if (!restaurant) {
    return { status: "error", message: "The menu isn’t available right now. Please try again shortly." };
  }

  // Always recomputed from the live menu on the server — a submitted quiz can never
  // hand back a dish, a price, or an availability flag directly.
  const items = await getMenuItems(restaurant.id);
  const match = findDishMatch(items, parsed.data as QuizAnswers);

  let saved = false;
  if (formData.get("save") === "on") {
    // Saving is optional and only ever happens for the signed-in customer's own row.
    const auth = await getAuthContext();
    if (auth) {
      const supabase = await createClient();
      const { error } = await supabase.from("taste_profiles").upsert(
        {
          customer_id: auth.user.id,
          preferred_moods: [parsed.data.mood],
          spice_preference: parsed.data.spice,
          flavor_preferences: parsed.data.flavor ? [parsed.data.flavor] : [],
          texture_preferences: parsed.data.texture ? [parsed.data.texture] : [],
        },
        { onConflict: "customer_id" },
      );
      if (error) {
        console.error("[find-my-dish] Could not save taste profile:", error.message);
      } else {
        saved = true;
      }
    }
  }

  return { status: "success", result: match, saved };
}
