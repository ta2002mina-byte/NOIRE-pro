import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { getRestaurant } from "@/lib/data/restaurant";

export const LEGAL_LAST_UPDATED = "30 September 2026";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/** Shared frame for the Privacy, Terms and Cookies pages. */
export async function LegalPage({ kicker, title, sections }: { kicker: string; title: string; sections: LegalSection[] }) {
  const restaurant = await getRestaurant();
  const name = restaurant?.name ?? "NOIRÉ";

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
      <SectionHeading level={1} kicker={kicker} title={title} align="center" className="mx-auto" />
      <p className="mt-4 text-center text-sm text-mute">Last updated {LEGAL_LAST_UPDATED}</p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-display text-xl text-ivory">{section.heading}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-mute [&_a]:text-ivory [&_a]:underline [&_li]:ml-5 [&_li]:list-disc">
              {section.body}
            </div>
          </section>
        ))}

        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-display text-xl text-ivory">Questions</h2>
          <p className="text-sm text-mute">
            If anything here is unclear, contact {name}
            {restaurant?.email ? (
              <>
                {" "}
                at <a href={`mailto:${restaurant.email}`} className="text-ivory underline">{restaurant.email}</a>
              </>
            ) : null}{" "}
            or use the <Link href="/contact" className="text-ivory underline">contact form</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
