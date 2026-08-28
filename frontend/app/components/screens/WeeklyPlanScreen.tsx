"use client";

import type { WeeklyPlan } from "@/lib/types";
import { PrimaryButton, GhostButton } from "../Buttons";
import { HabitRow } from "../HabitRow";
import { PointsCounter } from "../PointsCounter";

// Sits between committing to habits (AI recommend, or the Action Center) and
// the main dashboard: a real week-by-week checklist, not the single ongoing
// "is this active" toggle used elsewhere. Each week is tracked separately —
// ticking a habit in week 2 doesn't carry over to week 3 — and completing
// one earns its points fresh each week (backend/routers/weekly_plan.py). The
// plan always runs for exactly the weeks the goal itself was set for
// (AppShell creates it from timeline.idealWeeks) — never a separate pick.
export function WeeklyPlanScreen({
  goalName,
  goalEmoji,
  points,
  goalWeeksRemaining,
  plan,
  loading,
  selectedWeek,
  onSelectWeek,
  onToggleWeekHabit,
  aiCheckBusy,
  aiCheckNarration,
  onAICheck,
  onBack,
  onContinue,
}: {
  goalName: string;
  goalEmoji: string;
  points: number;
  goalWeeksRemaining: number | null;
  plan: WeeklyPlan | null;
  loading: boolean;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
  onToggleWeekHabit: (weekNumber: number, habitId: string) => void;
  aiCheckBusy: boolean;
  aiCheckNarration: string | null;
  onAICheck: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const week = plan?.weeks.find((w) => w.weekNumber === selectedWeek) ?? null;
  const doneCount = week ? week.habits.filter((h) => h.ticked).length : 0;
  const allDone = week ? doneCount === week.habits.length && week.habits.length > 0 : false;

  return (
    <section className="screen" data-screen="weekly-plan">
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
        <button className="icon-btn is-bare" onClick={onBack} aria-label="Back">
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
        <span className="eyebrow">Weekly plan</span>
        <h3 className="h-lg" style={{ margin: 0 }}>
          Track it week by week
        </h3>
        {plan && (
          <p className="small muted" aria-live="polite">
            You&apos;re looking at week {selectedWeek} of {plan.totalWeeks}
            {goalWeeksRemaining !== null ? ` · ${goalWeeksRemaining} weeks away from ${goalName}` : ""}.
          </p>
        )}
      </div>

      {!plan && loading && (
        <div className="card col" style={{ gap: 6 }}>
          <p className="small muted">Setting up your weekly plan…</p>
        </div>
      )}

      {plan && (
        <>
          <div className="col" style={{ gap: 4 }}>
            <label className="eyebrow" htmlFor="week-filter">
              Filter by week
            </label>
            <select
              id="week-filter"
              className="week-filter"
              value={selectedWeek}
              onChange={(e) => onSelectWeek(Number(e.target.value))}
            >
              {plan.weeks.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  Week {w.weekNumber} — {w.habits.filter((h) => h.ticked).length}/{w.habits.length} done
                </option>
              ))}
            </select>
          </div>

          {week && (
            <>
              <div className="row eyebrow">
                <span>Week {week.weekNumber} habits</span>
                <span className="tnum">
                  {doneCount}/{week.habits.length} done
                </span>
              </div>
              <div className="habits">
                {week.habits.map((h) => (
                  <div key={h.habit.habitId} className="col" style={{ gap: 4 }}>
                    <HabitRow
                      habit={h.habit}
                      ticked={h.ticked}
                      explanation={h.explanation}
                      onToggle={() => onToggleWeekHabit(week.weekNumber, h.habit.habitId)}
                    />
                    <p className={`tiny ${h.ticked ? "muted" : ""}`} style={{ padding: "0 14px", color: h.ticked ? undefined : "var(--slip-ink)" }}>
                      {h.ticked ? `Done in week ${week.weekNumber}.` : `You haven't done this in week ${week.weekNumber} yet.`}
                    </p>
                  </div>
                ))}
                {week.habits.length === 0 && (
                  <p className="small muted">No habits in this plan yet.</p>
                )}
              </div>

              {week.habits.length > 0 && !allDone && (
                <div className="card col" style={{ gap: 8 }}>
                  <span className="eyebrow">Let AI check your spending</span>
                  <p className="small muted">
                    AI reviews your spending this week and checks off what looks on track.
                  </p>
                  {aiCheckNarration && <p className="small">{aiCheckNarration}</p>}
                  <GhostButton onClick={onAICheck}>
                    {aiCheckBusy ? "Checking…" : "Let AI check this week"}
                  </GhostButton>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onContinue}>Are you ready? Go to my goal</PrimaryButton>
    </section>
  );
}
