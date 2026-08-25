"use client";

import { Chip } from "./Chip";

const TIMEFRAMES = [
  { m: 3, l: "3 mo" },
  { m: 6, l: "6 mo" },
  { m: 12, l: "12 mo" },
  { m: 24, l: "2 yrs" },
];

// Sheet — the goal-creation form. Never writes into a field the user currently has
// focus in (fights the cursor mid-keystroke); the caller owns the debounced commit
// to the backend (docs/03-engineering-handoff.md §2).
export function Sheet({
  emoji,
  name,
  amount,
  idealMonths,
  onNameChange,
  onAmountChange,
  onTimeframeChange,
}: {
  emoji: string;
  name: string;
  amount: string;
  idealMonths: number;
  onNameChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onTimeframeChange: (months: number) => void;
}) {
  return (
    <div className="card col" style={{ gap: 16 }}>
      <div className="col">
        <label className="tiny muted" htmlFor="gName">
          Name it
        </label>
        <div className="row card" style={{ background: "var(--card)", padding: "12px 16px" }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <input
            id="gName"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{ flex: 1, border: "none", background: "transparent", font: "600 16px var(--ui)", color: "var(--ink)" }}
          />
        </div>
      </div>
      <div className="col">
        <label className="tiny muted" htmlFor="gAmount">
          How much?
        </label>
        <div className="row card" style={{ background: "var(--card)", padding: "12px 16px", gap: 4 }}>
          <span className="num" style={{ fontSize: 25 }}>
            £
          </span>
          <input
            id="gAmount"
            value={amount}
            inputMode="numeric"
            onChange={(e) => onAmountChange(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              font: "800 25px var(--display)",
              letterSpacing: "-.03em",
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          />
        </div>
      </div>
      <div className="col">
        <span className="tiny muted">Ideally by when?</span>
        <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 8 }}>
          {TIMEFRAMES.map((t) => (
            <Chip key={t.m} variant={idealMonths === t.m ? "sel" : "default"} onClick={() => onTimeframeChange(t.m)}>
              {t.l}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
