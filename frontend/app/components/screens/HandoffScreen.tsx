import { Icon } from "@/lib/icons";
import { PrimaryButton } from "../Buttons";

const CHECKS = [
  "Balance and spending, read-only",
  "The last three months, nothing older",
  "No money is ever moved by Able",
];

export function HandoffScreen({ partnerName, onStart }: { partnerName: string; onStart: () => void }) {
  return (
    <section className="screen" data-screen="handoff">
      <div className="row" style={{ marginTop: 24 }}>
        <div className="row" style={{ gap: 12, justifyContent: "flex-start" }}>
          <div className="brandmark">
            <Icon name="mark" />
          </div>
          <div className="col" style={{ gap: 0 }}>
            <strong style={{ fontSize: 16 }}>Able AI</strong>
            <span className="tiny muted">from {partnerName}</span>
          </div>
        </div>
      </div>
      <h2 className="h-lg" style={{ marginTop: 28 }}>
        Your bank set this up for you.
      </h2>
      <p className="muted small">
        Three months of your spending came across so Able can work out how far away your goals really are.
      </p>
      <div className="card ticks" style={{ marginTop: 8 }}>
        <ul style={{ display: "flex", flexDirection: "column", gap: 16, margin: 0, padding: 0 }}>
          {CHECKS.map((c) => (
            <li key={c}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ color: "var(--ink)" }}>
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
              <span className="small">{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="tiny muted">Sent securely by {partnerName}. Disconnect any time in settings.</p>
      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onStart}>Start</PrimaryButton>
    </section>
  );
}
