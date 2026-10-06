"use client";

import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import * as React from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = ["What’s good for two tonight?", "Anything vegetarian and not spicy?", "What do you recommend?"];

/** Turns "/menu/dish-slug" and "/reserve" style paths in a reply into real links; everything else stays plain text. */
function renderReply(text: string) {
  const parts = text.split(/(\/(?:menu\/[a-z0-9-]+|reserve|contact|menu|find-my-dish))/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Link key={index} href={part} className="text-blush underline">
        {part}
      </Link>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Couldn’t reach the assistant. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <section
          role="dialog"
          aria-label="Menu assistant"
          className="fixed inset-x-3 bottom-3 z-40 flex max-h-[min(34rem,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-raised shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-96"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="font-display text-lg text-ivory">Menu guide</h2>
              <p className="text-xs text-mute">AI assistant — confirm allergies with our staff.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 text-mute hover:text-ivory">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
            {messages.length === 0 ? (
              <>
                <p className="text-mute">Hi! Ask me about the menu — I’ll help you pick something you’ll love.</p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => void send(starter)}
                      className="rounded-full border border-line px-3 py-1.5 text-left text-xs text-ivory hover:border-ivory/60"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    message.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-claret px-3.5 py-2 text-ivory"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl border border-line px-3.5 py-2 text-ivory"
                  }
                >
                  {message.role === "assistant" ? renderReply(message.content) : message.content}
                </p>
              </div>
            ))}
            {busy ? <p className="text-xs text-mute">Thinking…</p> : null}
            {error ? (
              <p role="alert" className="text-xs text-red-300">
                {error}
              </p>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Your question
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={600}
              placeholder="Ask about the menu…"
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 text-sm text-ivory placeholder:text-mute focus:border-ivory/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-claret text-ivory hover:bg-claret-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-claret px-5 text-sm font-medium text-ivory shadow-xl hover:bg-claret-hover"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Ask the menu guide
        </button>
      )}
    </>
  );
}
