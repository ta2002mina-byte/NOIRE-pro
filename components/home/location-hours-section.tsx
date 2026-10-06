import { MapPin, Phone, Clock } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { parseOpeningHours, formatLocationLine, type Restaurant } from "@/lib/data/restaurant";

export function LocationHoursSection({ restaurant }: { restaurant: Restaurant | null }) {
  const hours = restaurant ? parseOpeningHours(restaurant.opening_hours) : [];
  const location = restaurant ? formatLocationLine(restaurant) : null;
  const hasDetails = restaurant && (restaurant.address_line || location || restaurant.phone || hours.length > 0);

  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading kicker="Visit" title="Location and hours" />

        {hasDetails ? (
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div>
              <MapPin className="h-5 w-5 text-blush" aria-hidden="true" />
              <p className="mt-3 text-ivory">{restaurant?.address_line ?? location}</p>
              {restaurant?.address_line && location ? <p className="text-mute">{location}</p> : null}
            </div>
            <div>
              <Phone className="h-5 w-5 text-blush" aria-hidden="true" />
              {restaurant?.phone ? (
                <a href={`tel:${restaurant.phone}`} className="mt-3 block text-ivory hover:underline">
                  {restaurant.phone}
                </a>
              ) : (
                <p className="mt-3 text-mute">Not listed yet</p>
              )}
              {restaurant?.email ? (
                <a href={`mailto:${restaurant.email}`} className="mt-1 block text-mute hover:text-ivory">
                  {restaurant.email}
                </a>
              ) : null}
            </div>
            <div>
              <Clock className="h-5 w-5 text-blush" aria-hidden="true" />
              {hours.length > 0 ? (
                <dl className="mt-3 space-y-1">
                  {hours.map((row) => (
                    <div key={row.day} className="flex justify-between gap-4 text-sm">
                      <dt className="text-mute">{row.day}</dt>
                      <dd className="text-ivory">{row.hours}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-mute">Hours not listed yet</p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="Location details are coming."
            description="Our address, hours and contact information will appear here soon."
          />
        )}
      </div>
    </section>
  );
}
