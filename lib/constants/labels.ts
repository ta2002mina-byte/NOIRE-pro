/** Human-readable labels for database values that are stored as snake_case. */

export const STORY_TYPE_LABELS: Record<string, string> = {
  kitchen: "From the kitchen",
  chef: "Chef story",
  dish: "Dish story",
  ingredient: "Ingredient story",
  behind_the_scenes: "Behind the scenes",
  event: "Event",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  farm: "Farm",
  supplier: "Supplier",
  market: "Market",
  foraged: "Foraged",
  in_house: "Made in house",
  other: "Other",
};

export const CHEF_NOTE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting approval",
  published: "Published",
  hidden: "Hidden",
};

/** Falls back to a tidied version of the raw value, so a new type added in the database never renders as snake_case. */
export function labelFor(labels: Record<string, string>, value: string): string {
  const known = labels[value];
  if (known) return known;
  const words = value.replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : value;
}
