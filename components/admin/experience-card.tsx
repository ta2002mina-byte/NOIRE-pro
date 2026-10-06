import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Media } from "@/components/ui/media";
import { DeleteExperienceButton } from "@/components/admin/delete-experience-button";
import { ToggleExperienceActiveButton } from "@/components/admin/toggle-experience-button";
import { areaLabel } from "@/lib/constants/reservation";
import type { DiningExperience } from "@/lib/data/experiences";

function guestRangeLabel(experience: DiningExperience): string | null {
  const { min_guests, max_guests } = experience;
  if (min_guests && max_guests) return `${min_guests}–${max_guests} guests`;
  if (min_guests) return `${min_guests}+ guests`;
  if (max_guests) return `Up to ${max_guests} guests`;
  return null;
}

export function ExperienceCard({ experience }: { experience: DiningExperience }) {
  const guestRange = guestRangeLabel(experience);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised sm:flex-row">
      <Media
        src={experience.image_url}
        alt={experience.title}
        ratio="aspect-[3/2]"
        className="w-full sm:w-56 sm:shrink-0"
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-ivory">{experience.title}</p>
            <p className="text-sm text-mute">/reserve?experience={experience.slug}</p>
          </div>
          <Badge tone={experience.is_active ? "default" : "outline"}>
            {experience.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {experience.description ? <p className="line-clamp-2 text-sm text-mute">{experience.description}</p> : null}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
          {guestRange ? <span>{guestRange}</span> : null}
          <span>
            {experience.available_areas.length > 0
              ? experience.available_areas.map((a) => areaLabel(a)).join(", ")
              : "Any area"}
          </span>
          <span>Order {experience.sort_order}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link href={`/admin/experiences/${experience.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          <ToggleExperienceActiveButton id={experience.id} isActive={experience.is_active} />
          <DeleteExperienceButton id={experience.id} title={experience.title} />
        </div>
      </div>
    </li>
  );
}
