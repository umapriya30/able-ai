import { money, money2 } from "@/lib/format";
import type { HabitLibraryEntry } from "@/lib/types";

const WEEKS_PER_MONTH = 4.345;

// Toggling only flips `data-done`/aria-pressed on this same element (never remounted
// by key change) — replacing the node on tick would cancel the checkbox stroke and
// row-fill animation (docs/03-engineering-handoff.md §5).
//
// The chevron opens the working: where the AI found this money, in the user's
// own figures (design board 08). It is arithmetic on their spending, never
// advice — the copy comes from the API, which is where that rule is enforced.
export function HabitRow({
  habit,
  ticked,
  explanation,
  expanded = false,
  onToggle,
  onExpand,
}: {
  habit: HabitLibraryEntry;
  ticked: boolean;
  explanation?: string;
  expanded?: boolean;
  onToggle: () => void;
  onExpand?: () => void;
}) {
  const monthly = habit.weeklySaving * WEEKS_PER_MONTH;

  return (
    <div className="habit-block" data-done={ticked ? "true" : "false"}>
      <div className="habit">
        <button
          className="box"
          role="checkbox"
          aria-checked={ticked}
          aria-label={(ticked ? "Untick" : "Tick") + " " + habit.label}
          onClick={onToggle}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </button>

        <button
          className="habit-open"
          aria-expanded={expanded}
          onClick={onExpand}
          disabled={!onExpand}
        >
          <span className="col" style={{ gap: 3, flex: 1 }}>
            <span className="habit-label">{habit.label}</span>
            <span className="habit-meta eyebrow tnum">
              +{money2(habit.weeklySaving)}/wk · {habit.points} pts
            </span>
          </span>
          {onExpand && (
            <span className="chev" data-open={expanded} aria-hidden="true">
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 3l5 5-5 5" />
              </svg>
            </span>
          )}
        </button>
      </div>

      {expanded && explanation && (
        <div className="habit-why">
          <span className="eyebrow">Where this came from</span>
          <p className="why-body">{explanation}</p>
          <div className="why-tiles">
            <div className="tile">
              <span className="eyebrow">Per week</span>
              <span className="num tile-fig">{money2(habit.weeklySaving)}</span>
            </div>
            <div className="tile is-momentum">
              <span className="eyebrow">Freed up</span>
              <span className="num tile-fig">{money(monthly)}/mo</span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onToggle}>
            {ticked ? "Remove from this week" : "Add to this week"}
          </button>
        </div>
      )}
    </div>
  );
}
