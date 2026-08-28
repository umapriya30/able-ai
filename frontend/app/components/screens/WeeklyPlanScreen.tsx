"use client";

import type { WeeklyPlan } from "@/lib/types";
import { PrimaryButton } from "../Buttons";
import { Chip } from "../Chip";
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
  plan,
  loading,
  selectedWeek,
  onSelectWeek,
  onToggleWeekHabit,
  onBack,
  onContinue,
}: {
  goalName: string;
  goalEmoji: string;
  points: number;
  plan: WeeklyPlan | null;
  loading: boolean;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
  onToggleWeekHabit: (weekNumber: number, habitId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const week = plan?.weeks.find((w) => w.weekNumber === selectedWeek) ?? null;
  const doneCount = week ? week.habits.filter((h) => h.ticked).length : 0;

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
      </div>

      {!plan && loading && (
        <div className="card col" style={{ gap: 6 }}>
          <p className="small muted">Setting up your weekly plan…</p>
        </div>
      )}

      {plan && (
        <>
          <div className="col" style={{ gap: 8 }}>
            <span className="eyebrow">Select week</span>
            <div className="chips" role="tablist" aria-label="Select week">
              {plan.weeks.map((w) => (
                <Chip
                  key={w.weekNumber}
                  variant={w.weekNumber === selectedWeek ? "sel" : "default"}
                  onClick={() => onSelectWeek(w.weekNumber)}
                >
                  Week {w.weekNumber}
                </Chip>
              ))}
            </div>
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
                  <HabitRow
                    key={h.habit.habitId}
                    habit={h.habit}
                    ticked={h.ticked}
                    explanation={h.explanation}
                    onToggle={() => onToggleWeekHabit(week.weekNumber, h.habit.habitId)}
                  />
                ))}
                {week.habits.length === 0 && (
                  <p className="small muted">No habits in this plan yet.</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onContinue}>Are you ready? Go to my goal</PrimaryButton>
    </section>
  );
}
