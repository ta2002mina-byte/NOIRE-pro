// Run with: npm test   (Node 22+, runs the TypeScript source directly)
import test from "node:test";
import assert from "node:assert/strict";

import { isChefNoteLive, isStoryLive, onlyPublishedSources } from "../lib/data/visibility.ts";
import { STORY_TYPE_LABELS, SOURCE_TYPE_LABELS, labelFor } from "../lib/constants/labels.ts";
import { formatDateLong, formatDateOnly, formatTime } from "../lib/utils/format.ts";

const NOW = new Date("2026-09-20T18:00:00Z");
const HOUR = 3_600_000;
const at = (hours) => new Date(NOW.getTime() + hours * HOUR).toISOString();

test("a story is live only inside its window and while active", () => {
  assert.equal(isStoryLive({ is_active: true, published_at: at(-1), expires_at: at(1) }, NOW), true);
  assert.equal(isStoryLive({ is_active: true, published_at: at(-1), expires_at: null }, NOW), true);
  assert.equal(isStoryLive({ is_active: false, published_at: at(-1), expires_at: null }, NOW), false, "switched off");
  assert.equal(isStoryLive({ is_active: true, published_at: null, expires_at: null }, NOW), false, "never published");
  assert.equal(isStoryLive({ is_active: true, published_at: at(1), expires_at: null }, NOW), false, "not yet published");
  assert.equal(isStoryLive({ is_active: true, published_at: at(-5), expires_at: at(-1) }, NOW), false, "expired");
  assert.equal(isStoryLive({ is_active: true, published_at: at(-5), expires_at: at(0) }, NOW), false, "expires exactly now");
  assert.equal(isStoryLive({ is_active: true, published_at: "not a date", expires_at: null }, NOW), false, "bad date fails closed");
});

test("chef notes: published, or scheduled and due; drafts and archived never", () => {
  assert.equal(isChefNoteLive({ status: "published", publish_at: null }, NOW), true);
  assert.equal(isChefNoteLive({ status: "published", publish_at: at(-2) }, NOW), true);
  assert.equal(isChefNoteLive({ status: "published", publish_at: at(2) }, NOW), false, "published but start time is later");
  assert.equal(isChefNoteLive({ status: "scheduled", publish_at: at(-1) }, NOW), true);
  assert.equal(isChefNoteLive({ status: "scheduled", publish_at: at(1) }, NOW), false, "scheduled, not due yet");
  assert.equal(isChefNoteLive({ status: "scheduled", publish_at: null }, NOW), false);
  assert.equal(isChefNoteLive({ status: "draft", publish_at: at(-1) }, NOW), false);
  assert.equal(isChefNoteLive({ status: "archived", publish_at: at(-1) }, NOW), false);
  assert.equal(isChefNoteLive({ status: "something-new", publish_at: null }, NOW), false, "unknown status fails closed");
});

test("only published sourcing facts are public", () => {
  const sources = [
    { id: "a", is_published: true },
    { id: "b", is_published: false },
  ];
  assert.deepEqual(onlyPublishedSources(sources).map((s) => s.id), ["a"]);
  assert.deepEqual(onlyPublishedSources([]), []);
});

test("database values never render as snake_case", () => {
  assert.equal(labelFor(STORY_TYPE_LABELS, "behind_the_scenes"), "Behind the scenes");
  assert.equal(labelFor(SOURCE_TYPE_LABELS, "in_house"), "Made in house");
  assert.equal(labelFor(STORY_TYPE_LABELS, "pop_up_night"), "Pop up night", "unknown values are tidied");
});

test("dates survive a bad time zone and do not shift across days", () => {
  assert.match(formatDateLong(NOW, "Not/AZone"), /September 20, 2026/);
  assert.match(formatDateLong(NOW, "UTC"), /Sunday, September 20, 2026/);
  assert.match(formatTime(NOW, "Not/AZone"), /6:00\s?PM/);
  assert.equal(formatDateOnly("2026-03-04"), "March 4, 2026");
  assert.equal(formatDateOnly("garbage"), "garbage");
});
