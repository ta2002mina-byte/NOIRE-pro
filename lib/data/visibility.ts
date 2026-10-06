/**
 * "Is this content public right now?", as pure functions.
 *
 * WHY THIS EXISTS: the Phase 1 policies say who may READ a row, but they are
 * permissive and OR-ed together. Staff have a `for all` policy, so a signed-in
 * staff member's session can read drafts, unpublished sourcing and expired
 * stories. That is right for the admin area and wrong for the public site, which
 * must look the same to everyone. Every public query therefore applies these
 * rules explicitly, mirroring the anonymous policies, instead of trusting RLS.
 *
 * No framework or database imports, so the rules are unit-tested (npm test).
 */

interface StoryWindow {
  is_active: boolean;
  published_at: string | null;
  expires_at: string | null;
}

interface ChefNoteWindow {
  status: string;
  publish_at: string | null;
}

interface SourceFlag {
  is_published: boolean;
}

function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Active, already published, and not yet expired. */
export function isStoryLive(story: StoryWindow, now: Date = new Date()): boolean {
  if (!story.is_active) return false;
  const published = toTime(story.published_at);
  if (published === null || published > now.getTime()) return false;
  const expires = toTime(story.expires_at);
  return expires === null || expires > now.getTime();
}

/** Published (with an optional start time), or scheduled and now due. Drafts and archived notes never show. */
export function isChefNoteLive(note: ChefNoteWindow, now: Date = new Date()): boolean {
  const publishAt = toTime(note.publish_at);
  if (note.status === "published") return publishAt === null || publishAt <= now.getTime();
  if (note.status === "scheduled") return publishAt !== null && publishAt <= now.getTime();
  return false;
}

/** Sourcing facts are public only after an admin explicitly publishes them. */
export function onlyPublishedSources<T extends SourceFlag>(sources: readonly T[]): T[] {
  return sources.filter((source) => source.is_published);
}
