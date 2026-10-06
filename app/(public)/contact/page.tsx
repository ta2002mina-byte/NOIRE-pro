import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAuthContext } from "@/lib/auth/session";
import { formatLocationLine, getRestaurant, parseOpeningHours } from "@/lib/data/restaurant";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with NOIRÉ.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const restaurant = await getRestaurant();
  const auth = await getAuthContext();
  const hours = restaurant ? parseOpeningHours(restaurant.opening_hours) : [];
  const location = restaurant ? formatLocationLine(restaurant) : null;
  const hasDetails = restaurant && (restaurant.address_line || restaurant.phone || restaurant.email || hours.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
      <SectionHeading level={1} kicker="Contact" title="Get in touch" align="center" className="mx-auto" />

      {hasDetails ? (
        <ul className="mt-12 space-y-6">
          {restaurant.address_line || location ? (
            <li className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blush" aria-hidden="true" />
              <address className="not-italic">
                <span className="sr-only">Address: </span>
                {restaurant.address_line ? <p className="text-ivory">{restaurant.address_line}</p> : null}
                {location ? <p className="text-mute">{location}</p> : null}
              </address>
            </li>
          ) : null}
          {restaurant.phone ? (
            <li className="flex items-center gap-4">
              <Phone className="h-5 w-5 shrink-0 text-blush" aria-hidden="true" />
              <span className="sr-only">Phone: </span>
              <a href={`tel:${restaurant.phone}`} className="text-ivory hover:underline">
                {restaurant.phone}
              </a>
            </li>
          ) : null}
          {restaurant.email ? (
            <li className="flex items-center gap-4">
              <Mail className="h-5 w-5 shrink-0 text-blush" aria-hidden="true" />
              <span className="sr-only">Email: </span>
              <a href={`mailto:${restaurant.email}`} className="break-all text-ivory hover:underline">
                {restaurant.email}
              </a>
            </li>
          ) : null}
          {hours.length > 0 ? (
            <li className="flex items-start gap-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blush" aria-hidden="true" />
              <div>
                <p className="sr-only">Opening hours</p>
                <dl className="space-y-1">
                  {hours.map((row) => (
                    <div key={row.day} className="flex gap-4 text-sm">
                      <dt className="w-24 text-mute">{row.day}</dt>
                      <dd className="text-ivory">{row.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          ) : null}
        </ul>
      ) : (
        <EmptyState
          className="mt-12"
          title="Contact details are coming."
          description="Our address, phone and hours will appear here once published."
        />
      )}

      {restaurant ? (
        <section aria-labelledby="contact-form-heading" className="mt-16 border-t border-line pt-12">
          <h2 id="contact-form-heading" className="font-display text-2xl text-ivory">
            Send us a message
          </h2>
          <p className="mb-8 mt-2 text-sm text-mute">Questions, private events, feedback — we read every message.</p>
          <ContactForm defaultName={auth?.profile?.full_name ?? ""} defaultEmail={auth?.profile?.email ?? auth?.user.email ?? ""} />
        </section>
      ) : null}
    </div>
  );
}
