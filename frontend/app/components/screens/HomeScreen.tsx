import type { Goal, Profile, SpendSaveSummary, TimelineResult } from "@/lib/types";
import { money2 } from "@/lib/format";
import { totalBalance } from "@/lib/derive";
import { Icon } from "@/lib/icons";
import { DonutSplit } from "../DonutSplit";
import { GoalCard } from "../GoalCard";

// Dashboard — design board 04. Reads top to bottom as: who you are, what you
// have, where it went, how far away each goal is, and the one action that
// starts a new one.
export function HomeScreen({
  profile,
  goals,
  timelines,
  spend,
  onOpenGoal,
  onCreateGoal,
  onOpenSettings,
}: {
  profile: Profile;
  goals: Goal[];
  timelines: Record<string, TimelineResult>;
  spend: SpendSaveSummary | null;
  onOpenGoal: (goalId: string) => void;
  onCreateGoal: () => void;
  onOpenSettings: () => void;
}) {
  const linked = profile.linkedBankIds.length || 1;
  const accounts = profile.accounts.length;

  return (
    <section className="screen" data-screen="home">
      <div className="row">
        <h2 className="h-md greeting">Hi, {profile.displayName}</h2>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
          <Icon name="settings" />
        </button>
      </div>

      <div className="card col" style={{ gap: 6 }}>
        <span className="eyebrow">Total balance</span>
        <span className="num balance-fig">{money2(totalBalance(profile))}</span>
        <span className="small muted">
          Across {accounts} account{accounts === 1 ? "" : "s"} · {linked} bank
          {linked === 1 ? "" : "s"} linked
        </span>
      </div>

      <div className="card">
        {spend ? (
          <DonutSplit spent={spend.spent} saved={spend.saved} periodDays={spend.periodDays} />
        ) : (
          <p className="small muted">Reading the last 30 days…</p>
        )}
      </div>

      <div className="row eyebrow">
        <span>Active goals · {goals.length}</span>
        <span>Distance</span>
      </div>

      <div className="col" style={{ gap: 10 }}>
        {goals.map((g) => {
          const tl = timelines[g.goalId];
          if (!tl) return null;
          return (
            <GoalCard
              key={g.goalId}
              emoji={g.emoji}
              name={g.label}
              targetAmount={g.targetAmount}
              timeline={tl}
              onClick={() => onOpenGoal(g.goalId)}
            />
          );
        })}
      </div>

      <button className="btn" style={{ marginTop: "auto" }} onClick={onCreateGoal}>
        <span className="glyph" aria-hidden="true">
          <Icon name="plus" size={18} />
        </span>
        Create new goal
      </button>
    </section>
  );
}
