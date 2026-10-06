import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The few cookies NOIRÉ uses and why.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Cookie Policy"
      sections={[
        {
          heading: "What are cookies?",
          body: <p>Cookies are small text files a website stores in your browser so it can remember things between pages and visits.</p>,
        },
        {
          heading: "What we use",
          body: (
            <ul>
              <li>
                <strong className="text-ivory">Sign-in cookies (essential).</strong> When you sign in, our authentication
                provider sets cookies that keep you signed in and protect your account. Without them, sign-in and the
                private areas can’t work.
              </li>
              <li>
                <strong className="text-ivory">A notice preference (essential).</strong> When you dismiss the cookie
                notice, your browser remembers that choice on your device so we don’t show it again.
              </li>
            </ul>
          ),
        },
        {
          heading: "What we don’t use",
          body: <p>We don’t use advertising, cross-site tracking or third-party analytics cookies.</p>,
        },
        {
          heading: "Your control",
          body: (
            <p>
              You can block or delete cookies in your browser settings, but you won’t be able to stay signed in. See also
              our <Link href="/privacy">Privacy Policy</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
