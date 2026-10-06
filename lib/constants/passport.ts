/**
 * Dining Passport milestone catalog. Thresholds here are for DISPLAY only
 * (progress bars, "3 of 5 dishes") — the source of truth for who actually
 * earns a milestone is public.recalculate_dining_passport() in the Phase 9
 * migration. Keep the numbers in sync if the rules ever change.
 */

export type PassportMetric = "visits_count" | "dishes_explored_count" | "experiences_completed_count";

export interface MilestoneDefinition {
  key: string;
  title: string;
  description: string;
  /** Which passport counter this milestone tracks toward, for the progress bar. */
  metric: PassportMetric;
  threshold: number;
  /** Set when a milestone needs more than one counter (e.g. Insider). */
  secondaryMetric?: PassportMetric;
  secondaryThreshold?: number;
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    key: "first_visit",
    title: "First Visit",
    description: "You joined us at NOIRÉ for the first time.",
    metric: "visits_count",
    threshold: 1,
  },
  {
    key: "explorer",
    title: "Explorer",
    description: "You've tried 5 different dishes from the menu.",
    metric: "dishes_explored_count",
    threshold: 5,
  },
  {
    key: "food_lover",
    title: "Food Lover",
    description: "You've dined with us on 5 separate visits.",
    metric: "visits_count",
    threshold: 5,
  },
  {
    key: "noire_insider",
    title: "NOIRÉ Insider",
    description: "10 visits and at least one curated experience — you know the house well.",
    metric: "visits_count",
    threshold: 10,
    secondaryMetric: "experiences_completed_count",
    secondaryThreshold: 1,
  },
];

export function getMilestoneDefinition(key: string): MilestoneDefinition | undefined {
  return MILESTONES.find((m) => m.key === key);
}

export const METRIC_LABELS: Record<PassportMetric, string> = {
  visits_count: "visits",
  dishes_explored_count: "dishes explored",
  experiences_completed_count: "experiences completed",
};
