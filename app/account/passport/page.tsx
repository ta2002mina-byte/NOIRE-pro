import type { Metadata } from "next";

import { MilestoneCard } from "@/components/account/milestone-card";
import { PassportStats } from "@/components/account/passport-stats";
import { requireAccess } from "@/lib/auth/session";
import { getCustomerPassport } from "@/lib/data/passport";

export const metadata: Metadata = { title: "Passport" };

export default async function Page() {
  const ctx = await requireAccess("/account/passport");

  const passport = await getCustomerPassport(ctx.user.id);
  const earned = passport.milestones.filter((m) => m.earned);
  const locked = passport.milestones.filter((m) => !m.earned);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-ivory">Dining passport</h1>
        <p className="mt-1 text-sm text-mute">
          Your visits and milestones, calculated by NOIRÉ from completed dining records.
        </p>
      </div>

      <PassportStats
        visitsCount={passport.visitsCount}
        dishesExploredCount={passport.dishesExploredCount}
        experiencesCompletedCount={passport.experiencesCompletedCount}
      />

      <div className="space-y-4">
        <h2 className="font-display text-lg text-ivory">
          Milestones earned <span className="text-mute">({earned.length})</span>
        </h2>
        {earned.length === 0 ? (
          <p className="text-sm text-mute">None yet — your first visit will earn your first milestone.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {earned.map((milestone) => (
              <MilestoneCard key={milestone.key} milestone={milestone} />
            ))}
          </ul>
        )}
      </div>

      {locked.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-display text-lg text-ivory">Still to unlock</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {locked.map((milestone) => (
              <MilestoneCard key={milestone.key} milestone={milestone} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
