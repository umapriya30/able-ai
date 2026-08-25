import { Icon, iconForCategory } from "@/lib/icons";
import { money2 } from "@/lib/format";
import type { HabitLibraryEntry } from "@/lib/types";

// Toggling only flips `data-done`/aria-pressed on this same element (never remounted
// by key change) — replacing the node on tick would cancel the checkbox stroke and
// row-fill animation (docs/03-engineering-handoff.md §5).
export function HabitRow({
  habit,
  ticked,
  where,
  onToggle,
}: {
  habit: HabitLibraryEntry;
  ticked: boolean;
  where?: string;
  onToggle: () => void;
}) {
  return (
    <button
      className="habit"
      data-done={ticked ? "true" : "false"}
      aria-pressed={ticked}
      onClick={onToggle}
    >
      <span className="box">
        <svg width={14} height={14} viewBox="0 0 24 24">
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      </span>
      <span className="hicon">
        <Icon name={iconForCategory(habit.categoryId)} />
      </span>
      <span className="col" style={{ gap: 4, flex: 1 }}>
        <span className="habit-label">{habit.label}</span>
        <span className="habit-meta">
          +{money2(habit.weeklySaving)}/wk · +{habit.points} pts
        </span>
        {where && <span className="habit-where">{where}</span>}
      </span>
    </button>
  );
}
