import type { TimelineResult } from "@/lib/types";
import { money } from "@/lib/format";

export function GoalCard({
  emoji,
  name,
  timeline,
  onClick,
}: {
  emoji: string;
  name: string;
  timeline: TimelineResult;
  onClick?: () => void;
}) {
  const progressClass =
    "progress" + (timeline.saved > 0 ? " is-faster" : timeline.onTrack ? "" : " is-slip");

  const momentumLabel = timeline.onTrack
    ? "Ahead of your date"
    : timeline.saved > 0
    ? `${timeline.saved} weeks faster than your usual rate`
    : "Behind your date — fixable";
  const momentumClass = "chip " + (timeline.saved > 0 ? "chip-mo" : timeline.onTrack ? "" : "chip-slip");

  const weeksLabel = timeline.zeroLeftover || timeline.weeks === null ? "—" : `${timeline.weeks} wks`;

  return (
    <button className="goalcard" onClick={onClick}>
      <div className="row">
        <span className="row" style={{ gap: 8, justifyContent: "flex-start" }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <strong>{name}</strong>
        </span>
        <span className="tiny muted tnum">{timeline.pct}%</span>
      </div>
      <div className={progressClass}>
        <span style={{ width: `${timeline.pct}%` }} />
      </div>
      <div className="distances">
        <div className="col" style={{ gap: 0 }}>
          <span className="num">{money(timeline.remaining)}</span>
          <span className="tiny muted">to go</span>
        </div>
        <div className="col" style={{ gap: 0 }}>
          <span className="num num-lead">{weeksLabel}</span>
          <span className="tiny muted">at this rate</span>
        </div>
      </div>
      <span className={momentumClass}>{momentumLabel}</span>
    </button>
  );
}
