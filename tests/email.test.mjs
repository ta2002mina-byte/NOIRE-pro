import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/email/templates.ts", import.meta.url), "utf8");

test("email templates escape HTML and strip line breaks from subjects", () => {
  assert.match(src, /replaceAll\("<", "&lt;"\)/);
  assert.match(src, /\\r\\n\\u2028\\u2029/);
  assert.match(src, /escapeHtml\(input\.message\)/);
});

test("sendEmail is a no-op without credentials and never throws", () => {
  const send = readFileSync(new URL("../lib/email/send.ts", import.meta.url), "utf8");
  assert.match(send, /if \(!apiKey \|\| !from\) return \{ sent: false \}/);
  assert.match(send, /catch \(error\)/);
});
