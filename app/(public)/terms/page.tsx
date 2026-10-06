import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the NOIRÉ website, accounts and reservations.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms of Service"
      sections={[
        {
          heading: "Using this site",
          body: (
            <p>
              By using this website or creating an account you agree to these terms and to our{" "}
              <Link href="/privacy">Privacy Policy</Link>. If you don’t agree, please don’t use the site.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <ul>
              <li>Give accurate information and keep your password secret.</li>
              <li>You are responsible for activity under your account. Tell us promptly if you think it has been misused.</li>
              <li>We may suspend or close accounts that break these terms or misuse the site.</li>
            </ul>
          ),
        },
        {
          heading: "Reservations",
          body: (
            <ul>
              <li>A reservation request is not guaranteed until we confirm it. We’ll notify you when its status changes.</li>
              <li>Please arrive on time. We may release a table if you are significantly late without letting us know.</li>
              <li>If your plans change, cancel or update your reservation as early as you can so others can dine.</li>
              <li>We may cancel or change a reservation if something unexpected happens, and will contact you where we can.</li>
              <li>Menu items, prices, experiences and availability can change and may be limited.</li>
            </ul>
          ),
        },
        {
          heading: "Reviews and your content",
          body: (
            <ul>
              <li>Reviews must be honest, based on your own experience, and free of abuse, hate, spam or private information about others.</li>
              <li>You keep ownership of what you write, but you give us permission to display reviews you submit on this site.</li>
              <li>We moderate reviews and may decline to publish, or remove, any that break these rules.</li>
            </ul>
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <p>
              Don’t attempt to break, overload or gain unauthorised access to the site, scrape it in bulk, or use it for
              anything unlawful or harmful.
            </p>
          ),
        },
        {
          heading: "Our content",
          body: (
            <p>
              The NOIRÉ name, logo, photography, text and design belong to us or our licensors. Please don’t copy or reuse
              them without permission.
            </p>
          ),
        },
        {
          heading: "Health and allergies",
          body: (
            <p>
              Dish information, including dietary and spice labels, is provided in good faith and may change. If you have
              an allergy or medical dietary need, please tell us when you reserve and again to your server.
            </p>
          ),
        },
        {
          heading: "Disclaimer and liability",
          body: (
            <p>
              The site is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential
              losses arising from your use of the site. Nothing here limits any right you have that cannot be limited by law.
            </p>
          ),
        },
        {
          heading: "Changes and governing law",
          body: (
            <p>
              We may update these terms; continuing to use the site after a change means you accept it. These terms are
              governed by the laws of the country in which the restaurant operates.
            </p>
          ),
        },
      ]}
    />
  );
}
