/**
 * Pure helpers (no framework imports) for admin-entered links, so the server
 * validation, the public components and the tests all share one definition.
 */

export interface FooterLink {
  label: string;
  href: string;
}

export const MAX_FOOTER_LINKS = 6;

/** Internal path ("/reserve"), in-page anchor ("#tonight"), or http(s)/mailto/tel URL.
 * Anything else — notably `javascript:` and protocol-relative `//host` — is rejected. */
export function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (!v || /[\s\\\u0000-\u001f\u007f]/.test(v)) return false;
  if (v.startsWith("#")) return v.length > 1;
  if (v.startsWith("//")) return false;
  if (v.startsWith("/")) return true;
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

/** Social profile links must be plain https URLs. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

/** True for links that stay on this site (rendered with next/link). */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/** Parses one "Label | /path" per line. Blank lines are ignored. */
export function parseFooterLinks(text: string): { links: FooterLink[]; error: string | null } {
  const links: FooterLink[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > MAX_FOOTER_LINKS) {
    return { links: [], error: `Use at most ${MAX_FOOTER_LINKS} links.` };
  }

  for (const [index, line] of lines.entries()) {
    const separator = line.indexOf("|");
    if (separator === -1) {
      return { links: [], error: `Line ${index + 1}: write it as “Label | /page”.` };
    }
    const label = line.slice(0, separator).trim();
    const href = line.slice(separator + 1).trim();
    if (!label || label.length > 40) {
      return { links: [], error: `Line ${index + 1}: the label must be 1–40 characters.` };
    }
    if (!isSafeHref(href)) {
      return { links: [], error: `Line ${index + 1}: the link must start with /, #, https://, mailto: or tel:.` };
    }
    links.push({ label, href });
  }
  return { links, error: null };
}

export function footerLinksToText(links: FooterLink[]): string {
  return links.map((link) => `${link.label} | ${link.href}`).join("\n");
}

/** Reads the jsonb column defensively — a hand-edited row must never break the footer. */
export function normalizeFooterLinks(value: unknown): FooterLink[] {
  if (!Array.isArray(value)) return [];
  const result: FooterLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { label, href } = item as Record<string, unknown>;
    if (typeof label === "string" && typeof href === "string" && label.trim() && isSafeHref(href)) {
      result.push({ label: label.trim(), href: href.trim() });
    }
  }
  return result.slice(0, MAX_FOOTER_LINKS);
}
