/** Pure helpers for the menu assistant — no I/O, so they are unit-testable. */

export const MAX_HISTORY_MESSAGES = 12;
export const MAX_MESSAGE_CHARS = 600;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Accepts only what the assistant needs from the browser: a short list of
 * {role, content} text messages ending with a user message. Anything else is rejected,
 * so a visitor can never smuggle in a "system" message or an oversized payload.
 */
export function parseChatMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const recent = input.slice(-MAX_HISTORY_MESSAGES);
  const messages: ChatMessage[] = [];
  for (const item of recent) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text) return null;
    messages.push({ role, content: text });
  }
  // The API needs the conversation to start with, and end on, a user turn.
  while (messages.length > 0 && messages[0].role !== "user") messages.shift();
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

/** A small fixed-window counter. In-memory: per server instance, which is plenty to cap abuse and cost. */
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    /** Returns true if this call is allowed (and counts it). */
    take(key: string): boolean {
      const time = now();
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= time) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= time) {
        hits.set(key, { count: 1, resetAt: time + windowMs });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count += 1;
      return true;
    },
  };
}
