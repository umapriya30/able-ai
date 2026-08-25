// StatPair — £ + weeks. `.num-lead` is the 44px figure: weeks, not money
// (docs/02-design-system.md §6 state classes).
export function StatPair({
  moneyLabel,
  moneyValue,
  weeksLabel,
  weeksValue,
  align = "left",
}: {
  moneyLabel: string;
  moneyValue: string;
  weeksLabel: string;
  weeksValue: string;
  align?: "left" | "right";
}) {
  return (
    <div className="row" style={{ alignItems: "flex-end" }}>
      <div className="col" style={{ gap: 0 }}>
        <span className="num" style={{ fontSize: 31 }}>
          {moneyValue}
        </span>
        <span className="tiny muted">{moneyLabel}</span>
      </div>
      <div className="col" style={{ gap: 0, textAlign: align === "right" ? "right" : "left" }}>
        <span className="num num-lead" style={{ fontSize: 44 }}>
          {weeksValue}
        </span>
        <span className="tiny muted">{weeksLabel}</span>
      </div>
    </div>
  );
}
