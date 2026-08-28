"use client";

import { useState } from "react";
import type { Bank } from "@/lib/types";
import { bankCode } from "@/lib/derive";

// Bank linking — design board 02. This screen carries the B2B story: partner
// banks route data to Able AI through their own API, read-only, and the user
// approves it inside their bank's app. Scopes are named in full, in mono,
// because a vague consent screen is the thing a judge will poke at.
const SUBTITLE: Record<string, string> = {
  natwest: "Personal · Business",
  clearbank: "Agency accounts",
  allica: "Business savings",
};

export function BankLinkScreen({
  banks,
  suggestedBankId,
  onContinue,
}: {
  banks: Bank[];
  suggestedBankId: string;
  onContinue: (bankId: string) => void;
}) {
  const [selected, setSelected] = useState(suggestedBankId);
  const chosen = banks.find((b) => b.bankId === selected) ?? banks[0];

  return (
    <section className="screen" data-screen="linking">
      <div className="col" style={{ gap: 8 }}>
        <span className="eyebrow">Step 1 of 2 · Open Banking</span>
        <h2 className="h-lg">Connect your bank</h2>
        <p className="small muted">
          Able AI reads your real spending through your bank&rsquo;s own API. It cannot move
          money.
        </p>
      </div>

      <div className="col" style={{ gap: 10 }}>
        {banks.map((bank) => (
          <button
            key={bank.bankId}
            className="card row bank-option"
            data-selected={bank.bankId === selected}
            aria-pressed={bank.bankId === selected}
            onClick={() => setSelected(bank.bankId)}
          >
            <span className="bank-code is-lg" aria-hidden="true">
              {bankCode(bank.displayName)}
            </span>
            <span className="col" style={{ gap: 3, flex: 1 }}>
              <span className="row-title">{bank.displayName}</span>
              <span className="eyebrow">{SUBTITLE[bank.bankId] ?? "Personal accounts"}</span>
            </span>
            <span className="chev" aria-hidden="true">
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 3l5 5-5 5" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      <div className="card col" style={{ gap: 12 }}>
        <span className="eyebrow">You will be asked to share</span>
        <div className="col" style={{ gap: 10 }}>
          {(chosen?.scopes ?? []).map((scope) => (
            <div className="row" key={scope} style={{ justifyContent: "flex-start", alignItems: "flex-start", gap: 10 }}>
              <span className="scope-tick" aria-hidden="true">
                <svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M4 9.5l3.2 3.2L14 6" />
                </svg>
              </span>
              <span className="col" style={{ gap: 2, flex: 1 }}>
                <span className="scope-name">{scope}</span>
                <span className="small muted">
                  {scope === "accounts:read"
                    ? "Account names and balances"
                    : "12 months of history, read-only"}
                </span>
              </span>
            </div>
          ))}
        </div>
        <hr className="rule" />
        <p className="small muted">
          No payment access. No card details. Consent expires in 90 days.
        </p>
      </div>

      <div className="col" style={{ marginTop: "auto", gap: 10 }}>
        <button className="btn" onClick={() => onContinue(selected)}>
          Continue to {chosen?.displayName ?? "your bank"}
        </button>
        <span className="eyebrow" style={{ textAlign: "center" }}>
          You approve this inside your bank&rsquo;s app
        </span>
      </div>
    </section>
  );
}
