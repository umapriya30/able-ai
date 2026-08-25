import type { SavingsHistoryPoint, TimelineResult } from "@/lib/types";
import { money, money2 } from "@/lib/format";
import { PrimaryButton } from "../Buttons";
import { PointsCounter } from "../PointsCounter";
import { TimelineRail } from "../TimelineRail";
import { SavingsTrendChart } from "../SavingsTrendChart";

export function TimelineScreen({
  goalEmoji,
  goalName,
  timeline,
  points,
  lever,
  isDragging,
  savingsHistory,
  onLeverChange,
  onDragStart,
  onDragEnd,
  onBack,
  onLockHabits,
}: {
  goalEmoji: string;
  goalName: string;
  timeline: TimelineResult;
  points: number;
  lever: number;
  isDragging: boolean;
  savingsHistory: SavingsHistoryPoint[] | null;
  onLeverChange: (v: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onBack: () => void;
  onLockHabits: () => void;
}) {
  const zero = timeline.zeroLeftover || timeline.weeks === null;

  let deltaBg = "var(--card-2)";
  let deltaBorder = "var(--line)";
  let deltaColor = "var(--ink)";
  let deltaHead = "";
  let deltaBody = "";
  if (zero) {
    deltaBg = "var(--slip-soft)";
    deltaBorder = "transparent";
    deltaColor = "var(--slip-ink)";
    deltaHead = "Nothing left over";
    deltaBody = timeline.message ?? "";
  } else if (timeline.saved > 0) {
    deltaBg = "var(--momentum-soft)";
    deltaBorder = "transparent";
    deltaColor = "var(--momentum-ink)";
    deltaHead = `${timeline.baseWeeks} → ${timeline.weeks} weeks`;
    deltaBody = `${timeline.saved} weeks earlier. ${timeline.onTrack ? "That beats the date you set." : "Keep going and you beat your date."}`;
  } else if (!timeline.onTrack) {
    deltaBg = "var(--slip-soft)";
    deltaBorder = "transparent";
    deltaColor = "var(--slip-ink)";
    deltaHead = `${timeline.weeks} weeks`;
    deltaBody = `Your date needs ${money2(timeline.remaining / Math.max(1, timeline.idealWeeks))} a week. Habits below close the gap.`;
  } else {
    deltaHead = `${timeline.weeks} weeks`;
    deltaBody = "This is where you stand today.";
  }

  return (
    <section className="screen" data-screen="timeline">
      <div className="row" style={{ marginTop: 16 }}>
        <button className="tiny muted" onClick={onBack} style={{ fontFamily: "var(--mono)" }}>
          ← Back
        </button>
        <PointsCounter value={points} />
      </div>
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{goalEmoji}</span>
        <h2 className="h-md">{goalName}</h2>
      </div>

      <div className="row" style={{ alignItems: "flex-end" }} aria-live="polite">
        <div className="col" style={{ gap: 0 }}>
          <span className="num" style={{ fontSize: 31 }}>
            {money(timeline.remaining)}
          </span>
          <span className="tiny muted">still to save</span>
        </div>
        <div className="col" style={{ gap: 0, textAlign: "right" }}>
          <span className="num" style={{ fontSize: 44 }}>
            {zero ? "—" : timeline.weeks}
          </span>
          <span className="tiny muted">weeks at this rate</span>
        </div>
      </div>

      <TimelineRail weeks={zero ? 0 : (timeline.weeks as number)} idealWeeks={timeline.idealWeeks} baseWeeks={timeline.baseWeeks} isDragging={isDragging} />

      <div className="card col">
        <div className="row">
          <span className="small" style={{ fontWeight: 600 }}>
            What if you put aside a bit more?
          </span>
          <span className={`chip tnum${lever > 0 ? " chip-mo" : ""}`}>+{money(lever)}/wk</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={lever}
          aria-label="Extra saved per week"
          onChange={(e) => onLeverChange(+e.target.value)}
          onPointerDown={onDragStart}
          onKeyDown={onDragStart}
          onPointerUp={onDragEnd}
          onKeyUp={onDragEnd}
          onBlur={onDragEnd}
        />
        <p className="tiny muted">
          {lever === 0
            ? "Drag to see what a small weekly change does to the date."
            : `${money(lever)} a week is about ${Math.round(lever / 3.5)} coffees — and ${
                zero || timeline.baseWeeks === null ? 0 : timeline.baseWeeks - (timeline.weeks as number)
              } weeks off the date.`}
        </p>
      </div>

      <div className="card col" style={{ background: deltaBg, borderColor: deltaBorder }}>
        <span className="num" style={{ fontSize: 25, color: deltaColor }}>
          {deltaHead}
        </span>
        <span className="small">{deltaBody}</span>
      </div>

      {savingsHistory && <SavingsTrendChart points={savingsHistory} />}

      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onLockHabits}>Lock these habits in</PrimaryButton>
    </section>
  );
}
