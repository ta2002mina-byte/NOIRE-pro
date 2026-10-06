import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NOIRÉ collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy Policy"
      sections={[
        {
          heading: "Who we are",
          body: (
            <p>
              NOIRÉ (“we”, “us”) operates this website and the dining experience behind it. This policy explains what
              personal information we collect when you use the site, why we collect it, and the choices you have.
            </p>
          ),
        },
        {
          heading: "What we collect",
          body: (
            <ul>
              <li>Account details: your name, email address, phone number (optional), profile photo (optional) and password (stored only as a secure hash by our authentication provider).</li>
              <li>Reservations: date, time, party size, table, occasion, special requests and dietary notes you give us.</li>
              <li>Your dining activity: visits we record after a completed reservation, milestones in your Dining Passport, favourite dishes, and your taste preferences if you choose to save them.</li>
              <li>Content you write: reviews, and private journal entries. Journal entries are visible only to you.</li>
              <li>Messages you send us through the Contact form.</li>
              <li>Basic technical data needed to keep the site working and secure, such as your IP address and browser type in server logs.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>To create and manage your account, and to keep you signed in.</li>
              <li>To take, confirm, change and cancel reservations, and to tell you about them.</li>
              <li>To personalise your experience, for example dish suggestions and your Dining Passport.</li>
              <li>To publish reviews you submit, after moderation.</li>
              <li>To answer your messages and requests.</li>
              <li>To keep the site secure, prevent abuse and fix problems.</li>
            </ul>
          ),
        },
        {
          heading: "What we don’t do",
          body: (
            <p>
              We do not sell your personal information. We do not use advertising or cross-site tracking cookies. Your
              private journal is never read by our staff.
            </p>
          ),
        },
        {
          heading: "Who handles your data",
          body: (
            <p>
              We use trusted service providers to run the site: a database and authentication provider (Supabase), a
              hosting provider, and, if enabled, an email delivery provider to send confirmations and replies. They
              process data only on our behalf and to provide those services. We may also disclose information when the
              law requires it.
            </p>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              We keep your account information for as long as your account exists. Contact messages are kept for as long
              as needed to answer you and for our records. You can ask us to delete your account and associated data at
              any time.
            </p>
          ),
        },
        {
          heading: "Your choices and rights",
          body: (
            <ul>
              <li>Update your name, phone number and photo from your profile at any time.</li>
              <li>Ask us for a copy of the personal information we hold about you.</li>
              <li>Ask us to correct or delete your information, or to close your account.</li>
              <li>Depending on where you live, you may have additional rights under local data-protection law.</li>
            </ul>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              Access to your data is restricted by role and by database-level rules, connections are encrypted, and
              private areas require you to sign in. No system is perfectly secure, so please use a strong, unique
              password.
            </p>
          ),
        },
        {
          heading: "Children",
          body: <p>This site is not directed at children under 13, and we do not knowingly collect their information.</p>,
        },
        {
          heading: "Cookies",
          body: (
            <p>
              We use only the cookies needed to keep you signed in. See our <Link href="/cookies">Cookie Policy</Link>.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: <p>We may update this policy from time to time. The “last updated” date above shows the latest version.</p>,
        },
      ]}
    />
  );
}
