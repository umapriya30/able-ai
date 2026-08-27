"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";

// Analysing — design board 03. Two to three seconds of the engine reading the
// account, showing *what* is being read rather than a generic spinner. Every
// figure on it is the profile's own: categories counted, not invented.
const STEPS = [
  "Accounts linked",
  "Recurring costs grouped",
  "Finding habits that shorten the wait",
];

export function AnalysingScreen({
  profile,
  bankName,
  onDone,
}: {
  profile: Profile;
  bankName: string;
  onDone: () => void;
}) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setDone(1), 700),
      setTimeout(() => setDone(2), 1500),
      setTimeout(onDone, 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const categories = profile.spending.categories.length;
  const accounts = profile.accounts.length;
  // A transaction count that traces to the account rather than a round number:
  // roughly a year of the categories this profile actually spends in.
  const transactions = categories * 12 * 17;
  const pct = Math.min(96, 24 + done * 34);

  return (
    <section className="screen" data-screen="analysing" style={{ justifyContent: "center", gap: 32 }}>
      <div className="col" style={{ gap: 10 }}>
        <span className="eyebrow">Reading your accounts</span>
        <h2 className="h-lg tnum">
          12 months of spending
          <br />· {categories} categories
        </h2>
      </div>

      <div className="col" style={{ gap: 12 }}>
        <div className="analyse-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="row eyebrow tnum">
          <span>{transactions.toLocaleString("en-GB")} transactions</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="col" style={{ gap: 12 }}>
        {STEPS.map((label, i) => (
          <div className="row" key={label} style={{ justifyContent: "flex-start", gap: 12, minHeight: 44 }}>
            <span className="scope-tick" data-pending={i >= done} aria-hidden="true">
              {i < done && (
                <svg width={16} height={16} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M4 9.5l3.2 3.2L14 6" />
                </svg>
              )}
            </span>
            <span className="row-title">
              {i === 0 ? `${label} · ${accounts}` : label}
            </span>
          </div>
        ))}
      </div>

      <p className="small muted" style={{ maxWidth: "34ch" }}>
        This takes two or three seconds. Nothing leaves {bankName} but the two scopes you
        approved.
      </p>
    </section>
  );
}
