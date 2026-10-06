/** Built-in copy used whenever a field on /admin/content is left blank. */
export const SITE_CONTENT_DEFAULTS = {
  heroEyebrow: "NOIRÉ",
  heroHeading: "Dinner, reimagined.",
  heroSubtext: "Your table. Your taste. Your story.",
  heroPrimaryLabel: "Discover Tonight",
  heroPrimaryHref: "#tonight",
  heroSecondaryLabel: "Reserve a table",
  heroSecondaryHref: "/reserve",
  footerTagline: "Your table. Your taste. Your story.",
  /** `{year}` and `{name}` are replaced when the footer renders. */
  footerCopyright: "© {year} {name}. All rights reserved.",
} as const;
