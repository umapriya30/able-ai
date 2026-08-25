// DonutSplit — 2 segments only (saving vs spending). Never used decoratively;
// selected-but-neutral stays --ink, never --momentum (docs/02-design-system.md §2).
export function DonutSplit({ savePct }: { savePct: number }) {
  return (
    <div className="donut">
      <svg width={86} height={86} viewBox="0 0 42 42" aria-hidden="true">
        <circle cx={21} cy={21} r={15.9} fill="none" stroke="var(--rail)" strokeWidth={6} />
        <circle
          cx={21}
          cy={21}
          r={15.9}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={6}
          strokeDasharray={`${savePct} ${100 - savePct}`}
          strokeDashoffset={25}
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
          style={{ transition: "stroke-dasharray .5s ease" }}
        />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central">
          {savePct}%
        </text>
      </svg>
    </div>
  );
}
