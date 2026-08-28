import type { TimelineResult } from "@/lib/types";
import { money } from "@/lib/format";

// GoalCard — design board 04. The card carries *distance*, not a percentage:
// a rail with the goalpost tick on it, and the week count as the figure that
// matters. Behind is --slip amber with the gap named; never red, never a
// downward arrow.

/** Where the marker and the goalpost tick sit on the rail.
 *
 * Behind schedule: the rail is the trajectory, so the marker fills it and the
 * goalpost falls back to where it actually is (65 of 372 weeks = 17.5%).
 * On track: the rail is the *target*, with headroom past it so the goalpost
 * tick never collides with the rail's own end cap. */
export function railGeometry(weeks: number, idealWeeks: number) {
  if (weeks >= idealWeeks) {
    const tick = idealWeeks > 0 && weeks > 0 ? (idealWeeks / weeks) * 100 : 0;
    return { fillPct: 100, tickPct: tick };
  }
  const horizon = idealWeeks * 1.14;
  return { fillPct: (weeks / horizon) * 100, tickPct: (idealWeeks / horizon) * 100 };
}

export function GoalCard({
  emoji,
  name,
  targetAmount,
  timeline,
  onClick,
}: {
  emoji: string;
  name: string;
  targetAmount: number;
  timeline: TimelineResult;
  onClick?: () => void;
}) {
  const unknown = timeline.zeroLeftover || timeline.weeks === null;
  const weeks = timeline.weeks ?? 0;
  const { fillPct, tickPct } = railGeometry(weeks, timeline.idealWeeks);
  const behind = !timeline.onTrack;

  // Green only where the week count is genuinely inside the goalpost — a card
  // that is merely *rendered* never earns it.
  const tone = unknown ? "var(--muted)" : behind ? "var(--slip)" : "var(--momentum)";
  const toneInk = unknown ? "var(--muted)" : behind ? "var(--slip-ink)" : "var(--momentum-ink)";

  const gap = Math.abs(weeks - timeline.idealWeeks);
  const status = unknown
    ? "No movement yet"
    : gap === 0
    ? "On your date"
    : behind
    ? `${gap}w past target`
    : `${gap}w ahead`;

  return (
    <button className="goalcard" onClick={onClick}>
      <div className="row">
        <span className="goal-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="goal-name">{name}</span>
        <span className="num goal-weeks" style={{ color: toneInk }}>
          {unknown ? "—" : `${weeks}w`}
        </span>
      </div>

      <div className="goal-rail">
        <i className="track" />
        <i className="fill" style={{ width: `${fillPct}%`, background: tone }} />
        <i className="ideal" style={{ left: `${tickPct}%` }} />
        {!unknown && (
          <i className="marker" style={{ left: `calc(${fillPct}% - 8px)`, background: tone }} />
        )}
      </div>

      <div className="row eyebrow tnum">
        <span>{money(targetAmount)}</span>
        <span style={{ color: toneInk }}>{status}</span>
      </div>
    </button>
  );
}
