import type { Profile } from "./types";

export function currentAccountBalance(profile: Profile): number {
  const current = profile.accounts.find((a) => a.type === "current");
  return current ? current.balance : profile.accounts[0]?.balance ?? 0;
}

/** Every linked account added up — the figure the dashboard leads with
 *  (design board 04: "Total balance · across 3 linked accounts"). */
export function totalBalance(profile: Profile): number {
  return profile.accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function topDiscretionaryCategory(profile: Profile) {
  const discretionary = profile.spending.categories.filter((c) => c.discretionary);
  discretionary.sort((a, b) => b.monthly - a.monthly);
  return discretionary[0] ?? null;
}

export function savePct(profile: Profile): number {
  if (profile.income.monthlyNet <= 0) return 0;
  return Math.round((profile.savings.monthlyAverage / profile.income.monthlyNet) * 100);
}

export function greetingName(profile: Profile): string {
  return "Morning, " + profile.displayName;
}

/** Two-letter bank code, board 02/13: NatWest -> NW, ClearBank -> CB,
 *  Allica Bank -> AB. Reads the capitals, so camel-cased names work. */
export function bankCode(displayName: string): string {
  const capitals = displayName.replace(/[^A-Z]/g, "");
  return (capitals.length >= 2 ? capitals : displayName.toUpperCase()).slice(0, 2);
}
