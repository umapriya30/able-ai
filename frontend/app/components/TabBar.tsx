import { Icon } from "@/lib/icons";
import type { IconName } from "@/lib/icons";
import type { ScreenName } from "@/lib/screens";

const TABS: { go: ScreenName; icon: IconName; label: string }[] = [
  { go: "home", icon: "home", label: "Home" },
  { go: "timeline", icon: "goals", label: "Goals" },
  { go: "habits", icon: "habits", label: "Habits" },
  { go: "rewards", icon: "you", label: "You" },
];

export function TabBar({ current, onGo }: { current: ScreenName; onGo: (s: ScreenName) => void }) {
  const activeTab = current === "newgoal" || current === "whatif" ? "timeline" : current;
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
