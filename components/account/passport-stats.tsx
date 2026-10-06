import { CalendarCheck, Sparkles, UtensilsCrossed } from "lucide-react";

function Stat({ icon: Icon, value, label }: { icon: typeof CalendarCheck; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line p-6 text-center">
      <Icon className="mx-auto h-5 w-5 text-blush" aria-hidden="true" />
      <p className="mt-3 font-display text-4xl text-ivory">{value}</p>
      <p className="mt-1 text-sm text-mute">{label}</p>
    </div>
  );
}

export function PassportStats({
  visitsCount,
  dishesExploredCount,
  experiencesCompletedCount,
}: {
  visitsCount: number;
  dishesExploredCount: number;
  experiencesCompletedCount: number;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <Stat icon={CalendarCheck} value={visitsCount} label="Visits" />
      <Stat icon={UtensilsCrossed} value={dishesExploredCount} label="Dishes explored" />
      <Stat icon={Sparkles} value={experiencesCompletedCount} label="Experiences completed" />
    </dl>
  );
}
