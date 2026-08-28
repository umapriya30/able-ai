import { money2 } from "@/lib/format";

// DonutSplit — 2 segments only, spent vs saved, in exact £ (design board 04).
// Percentages alone can't be checked against the balance above it, so the
// figures live in the legend and the ring only carries the proportion.
// --ink for spent, --momentum for saved: the saved arc is the only place on
// this screen where green is allowed, and it is money that stayed.
const R = 46;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function DonutSplit({
  spent,
  saved,
  periodDays = 30,
}: {
  spent: number;
  saved: number;
  periodDays?: number;
}) {
  const total = spent + saved;
  const spentLen = total > 0 ? (spent / total) * CIRCUMFERENCE : 0;
  const savedLen = total > 0 ? CIRCUMFERENCE - spentLen : 0;

  return (
    <div className="split">
      <div className="donut">
        <svg width={112} height={112} viewBox="0 0 112 112" aria-hidden="true">
          <g transform="rotate(-90 56 56)">
            <circle
              cx={56}
              cy={56}
              r={R}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={16}
              strokeDasharray={`${spentLen} ${CIRCUMFERENCE}`}
              style={{ transition: "stroke-dasharray .5s ease" }}
            />
            <circle
              cx={56}
              cy={56}
              r={R}
              fill="none"
              stroke="var(--momentum)"
              strokeWidth={16}
              strokeDasharray={`${savedLen} ${CIRCUMFERENCE}`}
              strokeDashoffset={-spentLen}
              style={{ transition: "stroke-dasharray .5s ease, stroke-dashoffset .5s ease" }}
            />
          </g>
        </svg>
        <span className="donut-centre eyebrow">
          Last
          <br />
          {periodDays} days
        </span>
      </div>

      <div className="legend">
        <div className="col" style={{ gap: 3 }}>
          <span className="eyebrow legend-key">
            <i className="swatch" style={{ background: "var(--ink)" }} />
            Spent
          </span>
          <span className="num legend-fig">{money2(spent)}</span>
        </div>
        <div className="col" style={{ gap: 3 }}>
          <span className="eyebrow legend-key">
            <i className="swatch" style={{ background: "var(--momentum)" }} />
            Saved
          </span>
          <span className="num legend-fig" style={{ color: "var(--momentum-ink)" }}>
            {money2(saved)}
          </span>
        </div>
      </div>
    </div>
  );
}
