"use client";

import { useState } from "react";
import type { Goal, HabitEntry, TimelineResult } from "@/lib/types";
import { money } from "@/lib/format";
import { Icon } from "@/lib/icons";
import { HabitRow } from "../HabitRow";
import { railGeometry } from "../GoalCard";

// The reality check — design boards 07 (behind), 08 (habit expanded) and
// 09 (habits ticked). One screen, three states of the same thing: the
// distance, and the two kinds of habit that close it.
export function GoalBreakdownScreen({
  goal,
  timeline,
  habits,
  points,
  onBack,
  onToggleHabit,
  onEditTarget,
  onComplete,
  onKeepSaving,
}: {
  goal: Goal;
  timeline: TimelineResult;
  habits: HabitEntry[];
  points: number;
  onBack: () => void;
  onToggleHabit: (habitId: string) => void;
  onEditTarget: () => void;
  onComplete: () => void;
  onKeepSaving: () => void;
}) {
  const [openHabit, setOpenHabit] = useState<string | null>(null);

  const unknown = timeline.zeroLeftover || timeline.weeks === null;
  const weeks = timeline.weeks ?? 0;
  const behind = !timeline.onTrack;
  const { fillPct, tickPct } = railGeometry(weeks, timeline.idealWeeks);

  const tone = unknown ? "var(--muted)" : behind ? "var(--slip)" : "var(--momentum)";
  const toneInk = unknown ? "var(--muted)" : behind ? "var(--slip-ink)" : "var(--momentum-ink)";

  // What the stated timeframe would actually take, next to what they have.
  const neededWeekly = timeline.idealWeeks > 0 ? timeline.remaining / timeline.idealWeeks : 0;
  const months = Math.round((timeline.idealWeeks / 4.345) * 10) / 10;

  const ticked = habits.filter((h) => h.ticked).length;
  const reductive = habits.filter((h) => h.habit.kind !== "productive");
  const productive = habits.filter((h) => h.habit.kind === "productive");
  // Two different things, and conflating them hid the button entirely:
  //   complete  — the money is actually there (saved == target)
  //   canMark   — the projection has met the goalpost, which is what the spec
  //               means by "the timeline bar reaches the target goalpost" and
  //               what makes "Mark goal reached" appear.
  const complete = timeline.pct >= 100;
  const canMark = !unknown && timeline.onTrack;

  const statusChip = complete
    ? { label: "Arrived", className: "chip chip-mo" }
    : unknown
    ? { label: "No rate yet", className: "chip" }
    : timeline.saved > 0
    ? { label: `${timeline.saved}w closer`, className: "chip chip-mo" }
    : behind
    ? { label: "Behind", className: "chip chip-slip" }
    : { label: "On track", className: "chip chip-mo" };

  const caption = unknown
    ? timeline.message
    : timeline.saved > 0
    ? `${timeline.saved} week${timeline.saved === 1 ? "" : "s"} came off the wait. ${
        behind ? "Still short of the goalpost." : "You are inside the goalpost."
      }`
    : "Tick a habit and the week count moves. Nothing else changes it.";

  const group = (label: string, rows: HabitEntry[]) =>
    rows.length > 0 && (
      <div className="col" style={{ gap: 10 }}>
        <span className="eyebrow">{label}</span>
        <div className="habits">
          {rows.map((h) => (
            <HabitRow
              key={h.habit.habitId}
              habit={h.habit}
              ticked={h.ticked}
              explanation={h.explanation}
              expanded={openHabit === h.habit.habitId}
              onToggle={() => onToggleHabit(h.habit.habitId)}
              onExpand={() =>
                setOpenHabit((cur) => (cur === h.habit.habitId ? null : h.habit.habitId))
              }
            />
          ))}
        </div>
      </div>
    );

  return (
    <section className="screen" data-screen="breakdown">
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
        <button className="icon-btn is-bare" onClick={onBack} aria-label="Back to dashboard">
          <span className="chev is-back" aria-hidden="true">
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 3l5 5-5 5" />
            </svg>
          </span>
        </button>
        <span className="goal-emoji" aria-hidden="true">
          {goal.emoji}
        </span>
        <h2 className="h-md" style={{ flex: 1 }}>
          {goal.label} {money(goal.targetAmount)}
        </h2>
        {points > 0 && <span className="chip chip-lime tnum">{points} pts</span>}
      </div>

      <div className="card col" style={{ gap: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="col" style={{ gap: 4 }}>
            <span className="eyebrow">
              {complete
                ? "Distance remaining"
                : unknown
                ? "Left over last month"
                : `At ${money(timeline.weekly)} a week you arrive in`}
            </span>
            <span className="num num-lead" aria-live="polite" style={{ color: toneInk }}>
              {unknown ? "£0.00" : `${weeks} weeks`}
            </span>
          </div>
          <span className={statusChip.className}>{statusChip.label}</span>
        </div>

        <div className="goal-rail is-hero">
          <i className="track" />
          {!unknown && <i className="fill" style={{ width: `${fillPct}%`, background: tone }} />}
          <i className="ideal" style={{ left: `${tickPct}%` }} />
          <i className="ideal-cap" style={{ left: `calc(${tickPct}% - 4px)` }} />
          {!unknown && (
            <i className="marker" style={{ left: `calc(${fillPct}% - 11px)`, background: tone }} />
          )}
        </div>
        <div className="row eyebrow tnum">
          <span>Today</span>
          <span style={{ color: "var(--ink)" }}>Target {timeline.idealWeeks}w</span>
          <span>{unknown ? "—" : `${weeks}w`}</span>
        </div>

        <p className="small muted">
          {unknown
            ? "Your money went out as fast as it came in, so we cannot put a date on this goal yet. We will not guess one."
            : caption}
        </p>

        <hr className="rule" />

        <div className="distances">
          <div className="col" style={{ gap: 4 }}>
            <span className="eyebrow">{months} months needs</span>
            <span className="num stat-fig">{money(neededWeekly)}/wk</span>
          </div>
          <div className="col" style={{ gap: 4 }}>
            <span className="eyebrow">You have spare</span>
            <span className="num stat-fig">{money(timeline.weekly)}/wk</span>
          </div>
        </div>

        <button className="btn btn-ghost" onClick={onEditTarget}>
          Edit target
        </button>
      </div>

      <div className="row eyebrow">
        <span>
          {unknown ? "Habits that would free up money" : "Action center · tap to tick"}
        </span>
        <span className="tnum">
          {ticked}/{habits.length} done
        </span>
      </div>

      {group("Reductive", reductive)}
      {group("Productive", productive)}

      {unknown && (
        <p className="small muted">
          Tick one and we will start measuring the distance from real money, not a guess.
        </p>
      )}

      {canMark && (
        <div className="col" style={{ marginTop: "auto", gap: 10 }}>
          <button className="btn" onClick={onComplete}>
            <span className="glyph" aria-hidden="true">
              <Icon name="mark" />
            </span>
            Mark goal reached
          </button>
          <button className="btn btn-ghost" onClick={onKeepSaving}>
            Keep saving into this goal
          </button>
        </div>
      )}
    </section>
  );
}
