import type { RewardTier } from "@/lib/types";

// RewardBar spans the whole tier journey 0…topTier, one <i> mark per tier — the same
// rail object as the timeline, just re-scaled to points (docs/02-design-system.md §6).
export function RewardBar({ points, tiers }: { points: number; tiers: RewardTier[] }) {
  const topTier = tiers[tiers.length - 1]?.points || 1;
  const fillPct = Math.min(100, (points / topTier) * 100);

  return (
    <div className="rewardbar">
      <span style={{ width: `${fillPct}%` }} />
      {tiers.map((t) => {
        const pct = (t.points / topTier) * 100;
        if (pct >= 99) return null; // the rounded bar end already reads as the top tier
        return <i key={t.points} style={{ left: `calc(${pct}% - 1px)` }} />;
      })}
    </div>
  );
}
