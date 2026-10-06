// Run with: npm test   (Node 22+, runs the TypeScript source directly)
import test from "node:test";
import assert from "node:assert/strict";

import { footerLinksToText, isHttpsUrl, isInternalHref, isSafeHref, normalizeFooterLinks, parseFooterLinks } from "../lib/utils/site-links.ts";
import { utcToZonedLocal, zonedLocalToUtc } from "../lib/utils/timezone.ts";

test("safe hrefs: pages, anchors, https, mailto and tel only", () => {
  for (const ok of ["/reserve", "/menu/truffle-pasta", "#tonight", "https://example.com/x", "mailto:hi@noire.com", "tel:+8801700000000"]) {
    assert.equal(isSafeHref(ok), true, ok);
  }
  for (const bad of ["", "#", "//evil.com", "javascript:alert(1)", "data:text/html,x", "ftp://x.com", "/a b", "/a\\b", "reserve"]) {
    assert.equal(isSafeHref(bad), false, bad);
  }
});

test("social links must be https", () => {
  assert.equal(isHttpsUrl("https://instagram.com/noire"), true);
  assert.equal(isHttpsUrl("http://instagram.com/noire"), false);
  assert.equal(isHttpsUrl("instagram.com/noire"), false);
});

test("internal vs external hrefs", () => {
  assert.equal(isInternalHref("/menu"), true);
  assert.equal(isInternalHref("//evil.com"), false);
  assert.equal(isInternalHref("#tonight"), false);
  assert.equal(isInternalHref("https://x.com"), false);
});

test("footer links parse one 'Label | link' per line", () => {
  const ok = parseFooterLinks("Careers | /contact\n\n  Privacy | https://example.com/privacy  ");
  assert.equal(ok.error, null);
  assert.deepEqual(ok.links, [
    { label: "Careers", href: "/contact" },
    { label: "Privacy", href: "https://example.com/privacy" },
  ]);
  assert.equal(parseFooterLinks("").links.length, 0);
  assert.ok(parseFooterLinks("no separator").error);
  assert.ok(parseFooterLinks("Bad | javascript:alert(1)").error);
  assert.ok(parseFooterLinks(" | /x").error);
  assert.ok(parseFooterLinks(Array.from({ length: 7 }, (_, i) => `L${i} | /x`).join("\n")).error);
});

test("footer links round-trip and a hand-edited jsonb value can't break the footer", () => {
  const links = [{ label: "Careers", href: "/contact" }];
  assert.deepEqual(parseFooterLinks(footerLinksToText(links)).links, links);
  assert.deepEqual(normalizeFooterLinks(null), []);
  assert.deepEqual(normalizeFooterLinks("nope"), []);
  assert.deepEqual(normalizeFooterLinks([{ label: "Ok", href: "/a" }, { label: "Bad", href: "javascript:x" }, 5, null, { label: 1, href: "/b" }]), [
    { label: "Ok", href: "/a" },
  ]);
});

test("banner dates: restaurant-local time <-> UTC", () => {
  assert.equal(zonedLocalToUtc("2026-10-01T18:00", "Asia/Dhaka")?.toISOString(), "2026-10-01T12:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-10-01T18:00", "UTC")?.toISOString(), "2026-10-01T18:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-01-15T09:00", "America/New_York")?.toISOString(), "2026-01-15T14:00:00.000Z");
  assert.equal(zonedLocalToUtc("2026-07-15T09:00", "America/New_York")?.toISOString(), "2026-07-15T13:00:00.000Z");
  assert.equal(zonedLocalToUtc("not a date", "UTC"), null);
  assert.equal(zonedLocalToUtc("2026-10-01T18:00", "Not/AZone")?.toISOString(), "2026-10-01T18:00:00.000Z");
  assert.equal(utcToZonedLocal("2026-10-01T12:00:00.000Z", "Asia/Dhaka"), "2026-10-01T18:00");
  assert.equal(utcToZonedLocal(null, "Asia/Dhaka"), "");
});
