import type { Goal, HabitEntry, Profile, TimelineResult } from "@/lib/types";
import { money, money2 } from "@/lib/format";
import { currentAccountBalance, greetingName, savePct, topDiscretionaryCategory } from "@/lib/derive";
import { DonutSplit } from "../DonutSplit";
import { GoalCard } from "../GoalCard";
import { HabitRow } from "../HabitRow";
import { PointsCounter } from "../PointsCounter";

export function HomeScreen({
  profile,
  goal,
  timeline,
  topHabit,
  points,
  onOpenTimeline,
  onToggleHabit,
}: {
  profile: Profile;
  goal: Goal;
  timeline: TimelineResult;
  topHabit: HabitEntry | null;
  points: number;
  onOpenTimeline: () => void;
  onToggleHabit: (habitId: string) => void;
}) {
  const pct = savePct(profile);
  const topFlex = topDiscretionaryCategory(profile);

  return (
    <section className="screen" data-screen="home">
      <div className="row" style={{ marginTop: 16 }}>
        <h2 className="h-md">{greetingName(profile)}</h2>
        <PointsCounter value={points} />
      </div>

      <div className="balance">
        <span className="num">{money2(currentAccountBalance(profile))}</span>
        <span className="tiny muted">current account · updated 2 min ago</span>
      </div>

      <div className="split">
        <DonutSplit savePct={pct} />
        <div className="legend">
          <div className="row">
            <span className="row" style={{ gap: 8, justifyContent: "flex-start" }}>
              <i className="swatch" style={{ background: "var(--ink)" }} />
              <span className="small">Saving</span>
            </span>
            <strong className="small tnum">{money(profile.savings.monthlyAverage)}</strong>
          </div>
          <div className="row">
            <span className="row" style={{ gap: 8, justifyContent: "flex-start" }}>
              <i className="swatch" style={{ background: "var(--rail)" }} />
              <span className="small">Spending</span>
            </span>
            <strong className="small tnum">{money(profile.spending.monthlyTotal)}</strong>
          </div>
          <p className="tiny muted">
            {topFlex
              ? `${topFlex.label} is your biggest flexible spend at ${money(topFlex.monthly)} a month.`
              : `You keep ${pct}% of what comes in.`}
          </p>
        </div>
      </div>

      <GoalCard emoji={goal.emoji} name={goal.label} timeline={timeline} onClick={onOpenTimeline} />

      <div className="col">
        <p className="eyebrow">Today</p>
        <div className="habits">
          {topHabit && (
            <HabitRow
              habit={topHabit.habit}
              ticked={topHabit.ticked}
              onToggle={() => onToggleHabit(topHabit.habit.habitId)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
