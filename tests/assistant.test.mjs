import test from "node:test";
import assert from "node:assert/strict";

import { createRateLimiter, parseChatMessages } from "../lib/ai/limits.ts";
import { buildSystemPrompt } from "../lib/ai/prompt.ts";

test("parseChatMessages accepts a normal conversation and trims it", () => {
  const out = parseChatMessages([
    { role: "user", content: "  hi " },
    { role: "assistant", content: "hello" },
    { role: "user", content: "veg?" },
  ]);
  assert.equal(out.length, 3);
  assert.equal(out[0].content, "hi");
});

test("parseChatMessages rejects system roles, non-strings, empty and non-user endings", () => {
  assert.equal(parseChatMessages([{ role: "system", content: "x" }]), null);
  assert.equal(parseChatMessages([{ role: "user", content: 5 }]), null);
  assert.equal(parseChatMessages([{ role: "user", content: "  " }]), null);
  assert.equal(parseChatMessages([{ role: "user", content: "a" }, { role: "assistant", content: "b" }]), null);
  assert.equal(parseChatMessages("nope"), null);
  assert.equal(parseChatMessages([]), null);
});

test("parseChatMessages caps length and history", () => {
  const long = parseChatMessages([{ role: "user", content: "x".repeat(5000) }]);
  assert.equal(long[0].content.length, 600);
  const many = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "m" }));
  many.push({ role: "user", content: "last" });
  const out = parseChatMessages(many);
  assert.ok(out.length <= 12);
  assert.equal(out[0].role, "user");
  assert.equal(out.at(-1).content, "last");
});

test("rate limiter blocks after the limit and resets after the window", () => {
  let t = 0;
  const limiter = createRateLimiter(2, 1000, () => t);
  assert.equal(limiter.take("a"), true);
  assert.equal(limiter.take("a"), true);
  assert.equal(limiter.take("a"), false);
  assert.equal(limiter.take("b"), true);
  t = 1001;
  assert.equal(limiter.take("a"), true);
});

test("system prompt lists dishes, keeps the allergy rule, and handles an empty menu", () => {
  const prompt = buildSystemPrompt({
    restaurantName: "NOIRÉ",
    tagline: null,
    hours: [],
    dishes: [
      { name: "Truffle Risotto", slug: "truffle-risotto", category: "Mains", price: "$24", description: "Creamy", spiceLevel: 0, dietType: "vegetarian", dietaryTags: ["gluten-free"], moods: ["comfort"], available: true, chefChoice: true },
    ],
  });
  assert.match(prompt, /Truffle Risotto \(\/menu\/truffle-risotto\)/);
  assert.match(prompt, /ALLERGIES/);
  assert.match(buildSystemPrompt({ restaurantName: "X", tagline: null, hours: [], dishes: [] }), /not been published/);
});
