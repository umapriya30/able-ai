"use client";

import { useMemo, useState } from "react";
import type { GoalCreateInput, Profile } from "@/lib/types";
import { money, money2 } from "@/lib/format";

const WEEKS_PER_MONTH = 4.345;
const EMOJI = ["🏠", "👟", "✈️", "🎓", "🚗", "🎁"];
const SLIDER_TICKS = [3, 6, 12, 18, 24, 36];

// Read once at module load rather than during render: Date.now() in a render
// path is impure and makes the derived week count unstable across re-renders.
const TODAY_MS = Date.now();
const DAY_MS = 86_400_000;

function isoPlusMonths(months: number): string {
  const d = new Date(TODAY_MS);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function monthsUntil(iso: string): number {
  const days = (new Date(iso).getTime() - TODAY_MS) / DAY_MS;
  return Math.max(0.25, Math.round((days / (WEEKS_PER_MONTH * 7)) * 100) / 100);
}

// Create goal — design boards 05 (what & how much) and 06a/06b (timeframe,
// months slider OR calendar date). Both timeframe controls write the same
// number; the API takes exactly one of them.
export function NewGoalScreen({
  profile,
  busy,
  onCreate,
  onCancel,
}: {
  profile: Profile;
  busy: boolean;
  onCreate: (input: GoalCreateInput) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState(EMOJI[0]);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<"months" | "date">("months");
  const [months, setMonths] = useState(12);
  const [date, setDate] = useState(() => isoPlusMonths(12));

  // The first read on their spending, at the rate the account already saves
  // at — the same arithmetic the engine runs, so the preview can't promise
  // something the reality check then takes away.
  const baselineWeekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH;
  const weeksAtBaseline = useMemo(
    () => (amount > 0 && baselineWeekly > 0 ? Math.ceil(amount / baselineWeekly) : null),
    [amount, baselineWeekly]
  );

  const dateMonths = useMemo(() => monthsUntil(date), [date]);

  const chosenMonths = mode === "months" ? months : dateMonths;
  const idealWeeks = Math.round(chosenMonths * WEEKS_PER_MONTH);
  const neededWeekly = idealWeeks > 0 ? amount / idealWeeks : 0;
  const affordable = weeksAtBaseline !== null && weeksAtBaseline <= idealWeeks;

  const submit = () =>
    onCreate({
      label: label.trim() || "New goal",
      emoji,
      targetAmount: amount,
      ...(mode === "months" ? { idealTimeframeMonths: months } : { targetDate: date }),
    });

  if (step === 1) {
    return (
      <section className="screen" data-screen="newgoal">
        <div className="col" style={{ gap: 8 }}>
          <span className="eyebrow">Step 1 of 2 · What &amp; how much</span>
          <h2 className="h-lg">What are you saving for?</h2>
        </div>

        <div className="card col" style={{ gap: 14 }}>
          <span className="eyebrow">Goal name</span>
          <input
            className="goal-input"
            value={label}
            placeholder="Set goal"
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Goal name"
          />
        </div>

        <div className="card col" style={{ gap: 12 }}>
          <span className="eyebrow">Target amount</span>
          <span className="num balance-fig tnum">{money(amount)}</span>
          <div className="chips">
            {[50, 100, 1000].map((step) => (
              <button key={step} className="chip" onClick={() => setAmount((a) => a + step)}>
                +{money(step)}
              </button>
            ))}
            {amount > 0 && (
              <button className="chip" onClick={() => setAmount(0)}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="col" style={{ gap: 10 }}>
          <span className="eyebrow">Pick an icon</span>
          <div className="chips">
            {EMOJI.map((e) => (
              <button
                key={e}
                className="emoji-pick"
                data-selected={e === emoji}
                onClick={() => setEmoji(e)}
                aria-pressed={e === emoji}
                aria-label={"Icon " + e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {amount > 0 && (
          <div className="card col" style={{ gap: 6 }}>
            <span className="eyebrow">First read on your spending</span>
            <p
              className="why-body"
              style={{ color: affordable ? "var(--momentum-ink)" : "var(--slip-ink)" }}
            >
              At {money2(baselineWeekly)} a week this is {weeksAtBaseline} weeks away.{" "}
              {affordable ? "Comfortable." : "We will show you a route."}
            </p>
          </div>
        )}

        <div className="col" style={{ marginTop: "auto", gap: 10 }}>
          <button className="btn" disabled={amount <= 0} onClick={() => setStep(2)}>
            Set a timeframe
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen" data-screen="newgoal">
      <div className="col" style={{ gap: 8 }}>
        <span className="eyebrow">Step 2 of 2 · Timeframe</span>
        <h2 className="h-lg">When do you want it by?</h2>
      </div>

      <div className="seg">
        <button aria-pressed={mode === "months"} onClick={() => setMode("months")}>
          In months
        </button>
        <button aria-pressed={mode === "date"} onClick={() => setMode("date")}>
          On a date
        </button>
      </div>

      {mode === "months" ? (
        <div className="card col" style={{ gap: 20 }}>
          <div className="row" style={{ justifyContent: "flex-start", alignItems: "flex-end", gap: 10 }}>
            <span className="num months-fig tnum">{months}</span>
            <span className="eyebrow" style={{ paddingBottom: 8 }}>
              months · {idealWeeks} weeks
            </span>
          </div>
          <input
            className="slider"
            type="range"
            min={1}
            max={36}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label="Months to save"
          />
          <div className="row eyebrow tnum" style={{ gap: 0 }}>
            {SLIDER_TICKS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="card col" style={{ gap: 12 }}>
          <span className="eyebrow">Pick a date</span>
          <input
            className="goal-input"
            type="date"
            value={date}
            min={isoPlusMonths(0)}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Target date"
          />
          <div className="row" style={{ justifyContent: "flex-start", alignItems: "flex-end", gap: 10 }}>
            <span className="num months-fig tnum">{idealWeeks}</span>
            <span className="eyebrow" style={{ paddingBottom: 6 }}>
              weeks from today · {chosenMonths} months
            </span>
          </div>
          <p className="small muted">Months and dates write the same number. Switch freely.</p>
        </div>
      )}

      <div className="card col" style={{ gap: 10 }}>
        <span className="eyebrow">That would mean</span>
        <div className="row" style={{ justifyContent: "flex-start", alignItems: "baseline", gap: 8 }}>
          <span
            className="num stat-fig"
            style={{ color: affordable ? "var(--momentum-ink)" : "var(--slip-ink)" }}
          >
            {money(neededWeekly)}
          </span>
          <span className="eyebrow">per week</span>
        </div>
        <p className="small muted">
          Your spending currently leaves {money2(baselineWeekly)} a week. We will show you the
          honest distance next.
        </p>
      </div>

      <div className="col" style={{ marginTop: "auto", gap: 10 }}>
        <button className="btn" disabled={busy} onClick={submit}>
          {busy ? "Working it out…" : "See the distance"}
        </button>
        <button className="btn btn-ghost" onClick={() => setStep(1)}>
          Back
        </button>
      </div>
    </section>
  );
}
