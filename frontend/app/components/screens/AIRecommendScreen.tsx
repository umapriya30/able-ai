"use client";

import { useState } from "react";
import type { AIHabitSuggestion, ChatMessage } from "@/lib/types";
import { PrimaryButton } from "../Buttons";
import { HabitRow } from "../HabitRow";
import { PointsCounter } from "../PointsCounter";
import { AIChatBox } from "../AIChatBox";

// Sits between opening a goal and the habit-tracking action center: reads
// the profile's own spend categories (generate_ai_habits, backend/ai_habits.py)
// and — when GROQ_API_KEY is set — narrates the ranked shortlist as one warm
// paragraph via Groq. Ticking a suggestion here calls the same toggle
// endpoint the action center uses, so it's never a separate code path.
export function AIRecommendScreen({
  goalName,
  goalEmoji,
  points,
  loading,
  narration,
  llmEnhanced,
  suggestions,
  chatMessages,
  chatBusy,
  onToggle,
  onChatSend,
  onBack,
  onContinue,
}: {
  goalName: string;
  goalEmoji: string;
  points: number;
  loading: boolean;
  narration: string | null;
  llmEnhanced: boolean;
  suggestions: AIHabitSuggestion[];
  chatMessages: ChatMessage[];
  chatBusy: boolean;
  onToggle: (habitId: string) => void;
  onChatSend: (message: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="screen" data-screen="ai-recommend">
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
        <button className="icon-btn is-bare" onClick={onBack} aria-label="Back to dashboard">
          <span className="chev is-back" aria-hidden="true">
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 3l5 5-5 5" />
            </svg>
          </span>
        </button>
        <span className="goal-emoji" aria-hidden="true">
          {goalEmoji}
        </span>
        <h2 className="h-md" style={{ flex: 1 }}>
          {goalName}
        </h2>
        <PointsCounter value={points} />
      </div>

      <div className="col" style={{ gap: 4 }}>
        <span className="eyebrow">AI recommendation{llmEnhanced ? "" : " · offline"}</span>
        <h3 className="h-lg" style={{ margin: 0 }}>
          What would close the gap fastest?
        </h3>
      </div>

      <div className="card col" aria-live="polite">
        {loading ? (
          <p className="small muted">Reading spending across every category…</p>
        ) : (
          <p className="small">{narration}</p>
        )}
      </div>

      {!loading && suggestions.length > 0 && (
        <div className="col" style={{ gap: 10 }}>
          <span className="eyebrow">Ranked by weekly impact</span>
          <div className="habits">
            {suggestions.map((s) => (
              <HabitRow
                key={s.habit.habitId}
                habit={s.habit}
                ticked={false}
                explanation={s.rationale}
                expanded={openId === s.habit.habitId}
                onToggle={() => onToggle(s.habit.habitId)}
                onExpand={() => setOpenId((cur) => (cur === s.habit.habitId ? null : s.habit.habitId))}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && <AIChatBox messages={chatMessages} busy={chatBusy} onSend={onChatSend} />}

      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onContinue}>Go to habit tracking</PrimaryButton>
    </section>
  );
}
