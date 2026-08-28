"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { Chip } from "./Chip";

// Lets the user steer the AI recommendation screen by conversation — "swap
// coffee for something else", "give me the biggest single saving" — instead
// of only accepting or ignoring the three cards it started with. Replies and
// the habits shown above come from the same backend call
// (chat_about_habits, backend/ai_habits.py), which only ever picks from the
// real computed candidate pool: it can change which suggestions are shown,
// never invent a new one or a new figure.
export function AIChatBox({
  messages,
  busy,
  onSend,
}: {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="card col" style={{ gap: 12 }}>
      <span className="eyebrow">AI Assistant</span>

      {messages.length > 0 && (
        <div ref={listRef} className="col" style={{ gap: 8, maxHeight: 220, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="small"
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--momentum-soft)" : "var(--card-2)",
                color: m.role === "user" ? "var(--momentum-ink)" : "var(--ink)",
                borderRadius: 10,
                padding: "8px 12px",
                maxWidth: "85%",
              }}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div
              className="small muted"
              style={{ alignSelf: "flex-start", background: "var(--card-2)", borderRadius: 10, padding: "8px 12px" }}
            >
              Thinking…
            </div>
          )}
        </div>
      )}

      <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", minWidth: 0 }}>
        <input
          value={draft}
          placeholder="e.g. I don't want to skip coffee…"
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "transparent",
            font: "600 15px var(--ui)",
            color: "var(--ink)",
          }}
        />
        <Chip onClick={submit}>{busy ? "…" : "Send"}</Chip>
      </div>
    </div>
  );
}
