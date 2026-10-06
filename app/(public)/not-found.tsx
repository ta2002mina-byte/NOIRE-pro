import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

/** Used when a public page calls notFound(), for example an unknown dish. Keeps the site frame. */
export default function PublicNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
      <h1 className="text-3xl sm:text-4xl">This table doesn’t exist</h1>
      <p className="text-mute">The page may have moved, or the link may be mistyped.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/menu" className={buttonStyles()}>
          See the menu
        </Link>
        <Link href="/" className={buttonStyles({ variant: "outline" })}>
          Back to the home page
        </Link>
      </div>
    </div>
  );
}
