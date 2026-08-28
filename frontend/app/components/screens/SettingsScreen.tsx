"use client";

import { useState } from "react";
import type { Bank, Profile } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { bankCode } from "@/lib/derive";

// Settings — design board 13. Renaming yourself changes the dashboard
// greeting, because it writes to the profile the whole app reads, not to a
// screen-local string.
export function SettingsScreen({
  profile,
  banks,
  onRename,
  onToggleNotifications,
  onLinkBank,
  linkBusy,
  linkError,
}: {
  profile: Profile;
  banks: Bank[];
  onRename: (name: string) => void;
  onToggleNotifications: (on: boolean) => void;
  onLinkBank: () => void;
  linkBusy: boolean;
  linkError: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.displayName);

  const linked = profile.linkedBankIds.length
    ? profile.linkedBankIds
    : [profile.bankId];
  const byId = new Map(banks.map((b) => [b.bankId, b]));
  const initials = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

  const commit = () => {
    const name = draft.trim();
    if (name && name !== profile.displayName) onRename(name);
    setEditing(false);
  };

  const notificationsOn = profile.preferences.notificationsEnabled;

  return (
    <section className="screen" data-screen="settings">
      <h2 className="h-md greeting">Settings</h2>

      <div className="card row">
        <span className="avatar" aria-hidden="true">
          {initials(profile.displayName)}
        </span>
        {editing ? (
          <input
            className="name-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(profile.displayName);
                setEditing(false);
              }
            }}
            aria-label="Display name"
          />
        ) : (
          <span className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
            <span className="row-title">{profile.displayName}</span>
            <span className="eyebrow">Display name · shows on your dashboard</span>
          </span>
        )}
        <button className="btn btn-ghost is-inline" onClick={editing ? commit : () => setEditing(true)}>
          {editing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <span className="eyebrow">Linked accounts</span>
        <div className="tiers card" style={{ padding: 0 }}>
          {linked.map((bankId) => {
            const bank = byId.get(bankId);
            const accounts = profile.accounts.length;
            return (
              <div className="tier" key={bankId}>
                <span className="bank-code" aria-hidden="true">
                  {bankCode(bank?.displayName ?? bankId)}
                </span>
                <span className="col" style={{ gap: 2, flex: 1 }}>
                  <span className="row-title">{bank?.displayName ?? bankId}</span>
                  <span className="eyebrow" style={{ color: "var(--momentum-ink)" }}>
                    Connected · {accounts} account{accounts === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
            );
          })}

          <button className="tier is-action" onClick={onLinkBank} disabled={linkBusy}>
            <span className="bank-code is-dashed" aria-hidden="true">
              <Icon name="plus" size={16} />
            </span>
            <span className="row-title" style={{ flex: 1, textAlign: "left" }}>
              {linkBusy ? "Connecting…" : "Add new account"}
            </span>
            <span className="chev" aria-hidden="true">
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 3l5 5-5 5" />
              </svg>
            </span>
          </button>
        </div>
        {linkError && <p className="small" style={{ color: "var(--slip-ink)" }}>{linkError}</p>}
      </div>

      <div className="tiers card" style={{ padding: 0 }}>
        <div className="tier">
          <span className="col" style={{ gap: 2, flex: 1 }}>
            <span className="row-title">Notifications</span>
            <span className="eyebrow">Weekly habit nudge · Sunday</span>
          </span>
          <button
            className="toggle"
            role="switch"
            aria-checked={notificationsOn}
            aria-label="Notifications"
            data-on={notificationsOn}
            onClick={() => onToggleNotifications(!notificationsOn)}
          >
            <span className="knob" />
          </button>
        </div>
        <div className="tier">
          <span className="row-title" style={{ flex: 1 }}>
            About Able AI
          </span>
          <span className="chev" aria-hidden="true">
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 3l5 5-5 5" />
            </svg>
          </span>
        </div>
      </div>

      <p className="eyebrow" style={{ lineHeight: 1.6 }}>
        Able AI never holds your money. Rewards are funded by partner banks&rsquo; education
        budgets.
      </p>
    </section>
  );
}
