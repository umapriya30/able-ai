import type { RewardTier } from "@/lib/types";
import { money2 } from "@/lib/format";

// Rewards — design board 12. Points are never vouchers: cash into savings,
// funded by the partner bank's education budget, and the funder is named on
// screen. One rate the whole way up, so any tier survives mental arithmetic.
export function RewardsScreen({
  partnerName,
  points,
  tiers,
  pointsPerGBP,
  claimedTierPoints,
  claimBusy,
  onClaim,
}: {
  partnerName: string;
  points: number;
  tiers: RewardTier[];
  pointsPerGBP: number;
  claimedTierPoints: number[];
  claimBusy: number | null;
  onClaim: (tierPoints: number) => void;
}) {
  const topTier = tiers[tiers.length - 1];
  const next = tiers.find((t) => t.points > points) ?? topTier;
  const toGo = Math.max(0, next.points - points);
  const barPct = Math.min(100, (points / next.points) * 100);

  // The tier the user can actually take right now: unlocked, not yet claimed.
  const claimable = [...tiers].reverse().find((t) => points >= t.points && !claimedTierPoints.includes(t.points));

  return (
    <section className="screen" data-screen="rewards">
      <h2 className="h-md greeting">Rewards</h2>

      <div className="card col" style={{ gap: 16 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="col" style={{ gap: 4 }}>
            <span className="eyebrow">Your points</span>
            <span className="num num-lead tnum" aria-live="polite">
              {points}
            </span>
          </div>
          <span className="chip chip-lime tnum">= {money2(points / pointsPerGBP)}</span>
        </div>

        {/* The rail again, third scale — same object as the goal card and the
            timeline, so progress always looks like distance travelled. */}
        <div className="goal-rail">
          <i className="track" />
          <i className="fill" style={{ width: `${barPct}%`, background: "var(--momentum)" }} />
          <i className="ideal" style={{ left: "100%" }} />
          <i
            className="marker"
            style={{ left: `calc(${barPct}% - 8px)`, background: "var(--momentum)" }}
          />
        </div>
        <div className="row eyebrow tnum">
          <span>{points} pts</span>
          <span style={{ color: "var(--ink)" }}>
            Next tier {next.points} pts · {money2(next.amountGBP)}
          </span>
        </div>

        <p className="small muted">
          {toGo === 0
            ? "Every tier unlocked. Claim what you have earned."
            : `${toGo} points to go. Roughly ${Math.max(1, Math.round(toGo / 15))} ticked habits.`}
        </p>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <span className="eyebrow">
          One rate the whole way · {pointsPerGBP} points = £1.00
        </span>
        <div className="tiers card" style={{ padding: 0 }}>
          {tiers.map((t) => {
            const unlocked = points >= t.points;
            const claimed = claimedTierPoints.includes(t.points);
            return (
              <div className="tier" key={t.points}>
                <div className="col" style={{ gap: 2 }}>
                  <span className="tier-pts tnum">{t.points.toLocaleString("en-GB")} points</span>
                  <span
                    className="eyebrow"
                    style={{ color: unlocked ? "var(--momentum-ink)" : "var(--muted)" }}
                  >
                    {claimed ? "Credited" : unlocked ? "Unlocked" : `${t.points - points} to go`}
                  </span>
                </div>
                <span className="num tier-amount tnum">{money2(t.amountGBP)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card col" style={{ gap: 8 }}>
        <span className="eyebrow">How this is paid</span>
        <p className="why-body">
          Cash, straight into your savings — never vouchers. Funded by {partnerName}&rsquo;s
          financial education budget.
        </p>
      </div>

      <button
        className="btn"
        style={{ marginTop: "auto" }}
        disabled={!claimable || claimBusy !== null}
        onClick={() => claimable && onClaim(claimable.points)}
      >
        {claimable
          ? claimBusy === claimable.points
            ? "Crediting…"
            : `Claim ${money2(claimable.amountGBP)} into savings`
          : `${toGo} points until your next bonus`}
      </button>
    </section>
  );
}
