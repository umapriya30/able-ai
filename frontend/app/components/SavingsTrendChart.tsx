import type { SavingsHistoryPoint } from "@/lib/types";
import { money2 } from "@/lib/format";

const W = 320;
const H = 108;
const BASE_Y = 92;
const TOP_Y = 10;

export function SavingsTrendChart({ points }: { points: SavingsHistoryPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.amount));
  const n = points.length;
  const slot = W / n;
  const barW = slot * 0.56;
  const current = points.find((p) => p.isCurrent) ?? points[points.length - 1];
  const peak = points.reduce((a, b) => (b.amount > a.amount ? b : a), points[0]);

  const avgSpent = points.reduce((sum, p) => sum + p.spent, 0) / n;
  const hotSpendThreshold = avgSpent * 1.05;
  const biggestSpendWeek = points.reduce((a, b) => (b.spent > a.spent ? b : a), points[0]);

  const bars = points.map((p, i) => {
    const h = ((BASE_Y - TOP_Y) * p.amount) / max;
    const x = i * slot + (slot - barW) / 2;
    const y = BASE_Y - h;
    const showLabel = p === current || (p === peak && p !== current);
    const hotSpend = p.spent > hotSpendThreshold;
    return { p, x, y, h, showLabel, hotSpend };
  });

  return (
    <div className="card col" style={{ gap: 8 }}>
      <div className="row">
        <span className="small" style={{ fontWeight: 600 }}>
          Weekly savings
        </span>
        <span className="tiny muted">last {n} weeks</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`Weekly savings trend. This week: ${money2(current.amount)}. Biggest spend week: ${
          biggestSpendWeek.weekLabel
        } at ${money2(biggestSpendWeek.spent)}.`}
      >
        <line x1={0} y1={BASE_Y} x2={W} y2={BASE_Y} stroke="var(--line)" strokeWidth={1.5} />
        {bars.map(({ p, x, y, h, showLabel, hotSpend }, i) => (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={4}
              fill={hotSpend ? "var(--slip)" : "var(--ink)"}
              opacity={p.isCurrent ? 1 : 0.55}
              stroke={p.isCurrent ? "var(--rail)" : "none"}
              strokeWidth={p.isCurrent ? 2 : 0}
            />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10}
                fontFamily="var(--mono)"
                fill="var(--muted)"
              >
                {money2(p.amount)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="tiny muted" aria-live="polite">
        This week you&rsquo;re on track to save <strong style={{ color: "var(--ink)" }}>{money2(current.amount)}</strong>.
      </p>
      <p className="tiny muted">
        Biggest spend: {biggestSpendWeek.weekLabel} ·{" "}
        <strong style={{ color: "var(--slip-ink)" }}>{money2(biggestSpendWeek.spent)}</strong>
      </p>
    </div>
  );
}
