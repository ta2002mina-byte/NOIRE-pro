import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  description,
  link,
  align = "left",
  level = 2,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  align?: "left" | "center";
  /** 1 for the title of a whole page, 2 for a section inside a page. */
  level?: 1 | 2;
  className?: string;
}) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.3em] text-blush">{kicker}</p>
      ) : null}
      <Heading className="mt-3 text-3xl leading-tight sm:text-4xl">{title}</Heading>
      {description ? <p className="mt-4 text-mute">{description}</p> : null}
      {link ? (
        <Link
          href={link.href}
          className={cn(
            "mt-5 inline-flex items-center gap-2 text-sm text-ivory underline-offset-4 hover:underline",
            align === "center" && "justify-center",
          )}
        >
          {link.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
