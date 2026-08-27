import { Icon } from "@/lib/icons";
import type { IconName } from "@/lib/icons";
import type { ScreenName } from "@/lib/screens";

const TABS: { go: ScreenName; icon: IconName; label: string }[] = [
  { go: "home", icon: "home", label: "Home" },
  { go: "breakdown", icon: "goals", label: "Goals" },
  { go: "rewards", icon: "habits", label: "Rewards" },
  { go: "settings", icon: "settings", label: "You" },
];

export function TabBar({ current, onGo }: { current: ScreenName; onGo: (s: ScreenName) => void }) {
  const activeTab =
    current === "newgoal" || current === "whatif" || current === "timeline" || current === "habits"
      ? "breakdown"
      : current;
  return (
    <nav className="tabs" aria-label="App sections">
      {TABS.map((t) => (
        <button key={t.go} aria-current={activeTab === t.go} onClick={() => onGo(t.go)}>
          <span className="glyph">
            <Icon name={t.icon} />
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
