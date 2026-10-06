import Link from "next/link";
import { Sparkles } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

export function FindMyDishSection() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-line bg-surface px-6 py-14 text-center sm:px-12">
          <Sparkles className="mx-auto h-6 w-6 text-blush" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-xl text-3xl sm:text-4xl">Find My Dish</h2>
          <p className="mx-auto mt-4 max-w-md text-mute">
            A short, personal quiz that matches your mood, hunger and taste to a dish on our menu.
          </p>
          <Link href="/find-my-dish" className={buttonStyles({ className: "mt-7" })}>
            Take the quiz
          </Link>
        </div>
      </div>
    </section>
  );
}
