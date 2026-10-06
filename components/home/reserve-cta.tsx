import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export function ReserveCta() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl sm:text-5xl">Your table is waiting.</h2>
        <p className="mx-auto mt-4 max-w-md text-mute">
          Tell us when you would like to join us, and we will find you a table.
        </p>
        <Link href="/reserve" className={buttonStyles({ size: "lg", className: "mt-8" })}>
          Reserve a table
        </Link>
      </div>
    </section>
  );
}
