import { NextResponse } from "next/server";

import { createRateLimiter, parseChatMessages } from "@/lib/ai/limits";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { getMenuItems } from "@/lib/data/menu";
import { getRestaurant, parseOpeningHours } from "@/lib/data/restaurant";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
// Per visitor and for the whole site, so a bug or a bot can't run up the bill.
const perVisitor = createRateLimiter(Number(process.env.ASSISTANT_DAILY_LIMIT_PER_VISITOR) || 20, DAY_MS);
const perMinute = createRateLimiter(6, 60 * 1000);
const wholeSite = createRateLimiter(Number(process.env.ASSISTANT_DAILY_LIMIT_TOTAL) || 500, DAY_MS);

let promptCache: { value: string; expires: number } | null = null;

async function getSystemPrompt(): Promise<string | null> {
  if (promptCache && promptCache.expires > Date.now()) return promptCache.value;
  const restaurant = await getRestaurant();
  if (!restaurant) return null;
  const items = await getMenuItems(restaurant.id);
  const value = buildSystemPrompt({
    restaurantName: restaurant.name,
    tagline: restaurant.tagline,
    hours: parseOpeningHours(restaurant.opening_hours),
    dishes: items.map((item) => ({
      name: item.name,
      slug: item.slug,
      category: item.category?.name ?? null,
      price: formatPrice(item.price, restaurant.currency),
      description: item.description,
      spiceLevel: item.spice_level,
      dietType: item.diet_type,
      dietaryTags: item.dietary_tags,
      moods: [...new Set(item.dish_preferences.map((p) => p.mood).filter((m): m is string => Boolean(m)))],
      available: item.is_available,
      chefChoice: item.is_chef_choice,
    })),
  });
  promptCache = { value, expires: Date.now() + 60_000 };
  return value;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "The assistant isn’t available." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const messages = parseChatMessages((body as { messages?: unknown } | null)?.messages);
  if (!messages) return NextResponse.json({ error: "Please type a short question." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!perMinute.take(ip) || !perVisitor.take(ip) || !wholeSite.take("all")) {
    return NextResponse.json({ error: "You’ve asked a lot today — please try again later or contact us." }, { status: 429 });
  }

  try {
    const system = await getSystemPrompt();
    if (!system) return NextResponse.json({ error: "The menu isn’t available right now." }, { status: 503 });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system,
        messages,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.error("[assistant] API error:", response.status);
      return NextResponse.json({ error: "The assistant is busy. Please try again." }, { status: 502 });
    }
    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? [])
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text)
      .join("\n")
      .trim();
    if (!reply) return NextResponse.json({ error: "The assistant is busy. Please try again." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[assistant] Failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "The assistant is busy. Please try again." }, { status: 502 });
  }
}
