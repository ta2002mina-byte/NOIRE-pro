import { ChatWidget } from "@/components/assistant/chat-widget";

/** Shows the chat button only when an Anthropic API key is configured; otherwise renders nothing. */
export function AssistantMount() {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;
  return <ChatWidget />;
}
