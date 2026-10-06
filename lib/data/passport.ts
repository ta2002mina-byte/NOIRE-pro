import "server-only";

import { MILESTONES, type MilestoneDefinition } from "@/lib/constants/passport";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export interface EarnedMilestone extends MilestoneDefinition {
  earned: true;
  awardedAt: string;
}

export interface LockedMilestone extends MilestoneDefinition {
  earned: false;
  awardedAt: null;
  /** Current progress toward the primary metric, for the progress bar. */
  progress: number;
  secondaryProgress?: number;
}

export type MilestoneStatus = EarnedMilestone | LockedMilestone;

export interface CustomerPassport {
  visitsCount: number;
  dishesExploredCount: number;
  experiencesCompletedCount: number;
  milestones: MilestoneStatus[];
}

const EMPTY_PASSPORT: CustomerPassport = {
  visitsCount: 0,
  dishesExploredCount: 0,
  experiencesCompletedCount: 0,
  milestones: MILESTONES.map((m) => ({ ...m, earned: false, awardedAt: null, progress: 0, secondaryProgress: 0 })),
};

function metricValue(passport: Tables<"dining_passports">, metric: MilestoneDefinition["metric"]): number {
  return passport[metric];
}

function buildMilestoneStatuses(
  passport: Tables<"dining_passports">,
  awarded: Map<string, Tables<"passport_milestones">>,
): MilestoneStatus[] {
  return MILESTONES.map((definition) => {
    const award = awarded.get(definition.key);
    if (award) {
      return { ...definition, earned: true, awardedAt: award.awarded_at };
    }
    return {
      ...definition,
      earned: false,
      awardedAt: null,
      progress: metricValue(passport, definition.metric),
      secondaryProgress: definition.secondaryMetric ? metricValue(passport, definition.secondaryMetric) : undefined,
    };
  });
}

/**
 * A signed-in customer's own passport: counters plus every milestone,
 * earned or locked. Everything here is derived server-side — nothing in
 * this response can be influenced by what the browser sends. RLS also
 * scopes dining_passports / passport_milestones to their own rows, so the
 * explicit filter below is defense in depth, same as the journal reads.
 */
export async function getCustomerPassport(customerId: string): Promise<CustomerPassport> {
  const supabase = await createClient();

  const [passportRes, milestonesRes] = await Promise.all([
    supabase.from("dining_passports").select("*").eq("customer_id", customerId).maybeSingle(),
    supabase.from("passport_milestones").select("*").eq("customer_id", customerId),
  ]);

  if (passportRes.error) console.error("[data/passport] getCustomerPassport (passport):", passportRes.error.message);
  if (milestonesRes.error) console.error("[data/passport] getCustomerPassport (milestones):", milestonesRes.error.message);

  const passport = passportRes.data;
  if (!passport) return EMPTY_PASSPORT;

  const awarded = new Map((milestonesRes.data ?? []).map((row) => [row.milestone_key, row]));

  return {
    visitsCount: passport.visits_count,
    dishesExploredCount: passport.dishes_explored_count,
    experiencesCompletedCount: passport.experiences_completed_count,
    milestones: buildMilestoneStatuses(passport, awarded),
  };
}

export interface PassportOverviewRow {
  customerId: string;
  fullName: string | null;
  email: string;
  visitsCount: number;
  dishesExploredCount: number;
  experiencesCompletedCount: number;
  milestonesEarned: number;
}

/**
 * Staff-only overview: every customer who has a passport, most visits
 * first. RLS restricts dining_passports reads to the owner or staff, so
 * this only ever returns rows when called on behalf of a staff member.
 */
export async function getPassportOverview(limit = 50): Promise<PassportOverviewRow[]> {
  const supabase = await createClient();

  type OverviewRow = Pick<
    Tables<"dining_passports">,
    "customer_id" | "visits_count" | "dishes_explored_count" | "experiences_completed_count"
  > & {
    profile: Pick<Tables<"profiles">, "full_name" | "email"> | null;
    milestones: { id: string }[];
  };

  const { data, error } = await supabase
    .from("dining_passports")
    .select(
      "customer_id, visits_count, dishes_explored_count, experiences_completed_count, profile:profiles(full_name, email), milestones:passport_milestones(id)",
    )
    .order("visits_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/passport] getPassportOverview:", error.message);
    return [];
  }

  return ((data as OverviewRow[] | null) ?? []).map((row) => ({
    customerId: row.customer_id,
    fullName: row.profile?.full_name ?? null,
    email: row.profile?.email ?? "",
    visitsCount: row.visits_count,
    dishesExploredCount: row.dishes_explored_count,
    experiencesCompletedCount: row.experiences_completed_count,
    milestonesEarned: row.milestones?.length ?? 0,
  }));
}
