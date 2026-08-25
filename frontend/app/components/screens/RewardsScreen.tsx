import type { RewardTier } from "@/lib/types";
import { money2 } from "@/lib/format";
import { Chip } from "../Chip";
import { RewardBar } from "../RewardBar";

export function RewardsScreen({
  partnerName,
  points,
  tiers,
  goalCompletionPoints,
  claimedTierPoints,
  rewardsCreditedGBP,
  accountBalance,
  claimBusy,
  onClaim,
}: {
  partnerName: string;
  points: number;
  tiers: RewardTier[];
  goalCompletionPoints: number;
  claimedTierPoints: number[];
  rewardsCreditedGBP: number;
  accountBalance: number;
  claimBusy: number | null;
  onClaim: (tierPoints: number) => void;
}) {
  const topTier = tiers[tiers.length - 1];
  const next = tiers.find((t) => t.points > points) ?? topTier;

  return (
    <section className="screen" data-screen="rewards">
      <div className="row" style={{ marginTop: 16 }}>
        <h2 className="h-md">Your points</h2>
      </div>
      <div className="col" style={{ gap: 4 }}>
        <span className="num" style={{ fontSize: 44 }}>
          <span className="tnum" aria-live="polite">
            {points}
          </span>
        </span>
        <RewardBar points={points} tiers={tiers} />
        <span className="tiny muted">
          {points >= next.points ? `${next.reward} unlocked` : `${next.points - points} points until ${next.reward}`}
        </span>
      </div>
      <div className="col">
        <div className="card tiers">
          {tiers.map((t) => {
            const unlocked = points >= t.points;
            const claimed = claimedTierPoints.includes(t.points);
            return (
              <div className="tier" key={t.points}>
                <span>{t.reward}</span>
                <span className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                  <span className="t-pts">
                    {t.points} pts{unlocked ? " · unlocked" : ""}
                  </span>
                  {unlocked && !claimed && (
                    <button className="mini" onClick={() => onClaim(t.points)} disabled={claimBusy === t.points}>
                      {claimBusy === t.points ? "…" : "Claim"}
                    </button>
                  )}
                  {claimed && (
                    <Chip variant="mo" style={{ fontSize: 12 }}>
                      Credited
                    </Chip>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card row" aria-live="polite">
        <span className="col" style={{ gap: 0 }}>
          <span className="tiny muted">Current account</span>
          <span className="small" style={{ fontWeight: 600 }}>
            {money2(accountBalance)}
          </span>
        </span>
        {rewardsCreditedGBP > 0 && (
          <Chip variant="mo">+{money2(rewardsCreditedGBP)} from rewards</Chip>
        )}
      </div>
      <div className="card col" style={{ gap: 6 }}>
        <Chip variant="lime" style={{ alignSelf: "flex-start" }}>
          Funded by your bank
        </Chip>
        <p className="small">
          Rewards come out of {partnerName}&rsquo;s financial education budget — not out of your savings, and not out of ours.
        </p>
      </div>
      <p className="tiny muted">Goal rewards: {goalCompletionPoints} points, one goal per month.</p>
      <div style={{ flex: 1 }} />
    </section>
  );
}
