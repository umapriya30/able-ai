import { useState } from "react";
import type { HabitEntry, TimelineResult } from "@/lib/types";
import { GhostButton } from "../Buttons";
import { Chip } from "../Chip";
import { HabitRow } from "../HabitRow";
import { PointsCounter } from "../PointsCounter";

export function HabitsScreen({
  goalName,
  habits,
  timeline,
  points,
  tickedCount,
  onToggleHabit,
  onAddCustomHabit,
  onSeeRewards,
}: {
  goalName: string;
  habits: HabitEntry[];
  timeline: TimelineResult;
  points: number;
  tickedCount: number;
  onToggleHabit: (habitId: string) => void;
  onAddCustomHabit: (label: string, weeklySaving: number) => void;
  onSeeRewards: () => void;
}) {
  const zero = timeline.zeroLeftover || timeline.weeks === null;
  const impact = timeline.saved;

  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const submitCustom = () => {
    const label = customLabel.trim();
    const weeklySaving = Number(customAmount);
    if (!label || !(weeklySaving > 0)) return;
    onAddCustomHabit(label, weeklySaving);
    setCustomLabel("");
    setCustomAmount("");
  };

  return (
    <section className="screen" data-screen="habits">
      <div className="row" style={{ marginTop: 16 }}>
        <h2 className="h-md">Habits</h2>
        <PointsCounter value={points} />
      </div>
      <div className="row">
        <span className="tiny muted" style={{ fontFamily: "var(--mono)" }}>
          THIS WEEK
        </span>
        <span className="streak" aria-label="3 of 7 days">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <i key={i} className={`dot${i < 3 ? " on" : ""}`} />
          ))}
        </span>
      </div>
      <div
        className="card row"
        aria-live="polite"
        style={{
          background: impact > 0 ? "var(--momentum-soft)" : "var(--card-2)",
          borderColor: impact > 0 ? "transparent" : "var(--line)",
        }}
      >
        <span className="col" style={{ gap: 0 }}>
          <span className="tiny muted">Weeks to {goalName}</span>
          <span className="small">{impact > 0 ? `${impact} weeks earlier than your usual rate` : "at today’s rate"}</span>
        </span>
        <span className="num" style={{ fontSize: 31, color: impact > 0 ? "var(--momentum-ink)" : "var(--ink)" }}>
          {zero ? "—" : timeline.weeks}
        </span>
      </div>
      <div className="habits">
        {habits.map((h) => (
          <HabitRow key={h.habit.habitId} habit={h.habit} ticked={h.ticked} onToggle={() => onToggleHabit(h.habit.habitId)} />
        ))}
      </div>
      <div className="card col" style={{ gap: 8 }}>
        <span className="tiny muted">Out of ready-made habits? Add your own.</span>
        <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", minWidth: 0 }}>
          <input
            value={customLabel}
            placeholder="Add your own habit…"
            onChange={(e) => setCustomLabel(e.target.value)}
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", font: "600 15px var(--ui)", color: "var(--ink)" }}
          />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", gap: 4, flex: 1, minWidth: 0 }}>
            <span className="num" style={{ fontSize: 15 }}>
              £
            </span>
            <input
              value={customAmount}
              inputMode="numeric"
              placeholder="/wk"
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "transparent",
                font: "600 15px var(--ui)",
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </div>
          <Chip onClick={submitCustom}>Add</Chip>
        </div>
      </div>
      <div className="card" aria-live="polite">
        <p className="small">
          {tickedCount === 0
            ? "Tick a habit to see it come off your timeline."
            : `${tickedCount} ${tickedCount === 1 ? "habit takes" : "habits take"} ${impact} weeks off ${goalName}.`}
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <GhostButton onClick={onSeeRewards}>See what points get you</GhostButton>
    </section>
  );
}
