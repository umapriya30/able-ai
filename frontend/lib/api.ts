import type {
  AIHabitSuggestion,
  Bank,
  ClaimRewardResponse,
  CustomHabitInput,
  GoalCompleteResponse,
  GoalCreateInput,
  GoalEditInput,
  Goal,
  HabitEntry,
  HabitLibraryEntry,
  HabitToggleResponse,
  LinkBankResponse,
  LoginResponse,
  Profile,
  ProfileEditInput,
  RewardRules,
  SavingsHistoryPoint,
  SignupInput,
  SpendSaveSummary,
  TimelineResult,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// loca.lt tunnels show an HTML interstitial to first-time visitor IPs unless
// this header is present, which would otherwise break every JSON response.
// Shadows the global `fetch` for calls in this module only.
const globalFetch = globalThis.fetch;
function fetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return globalFetch(input, {
    ...init,
    headers: { "Bypass-Tunnel-Reminder": "true", ...init.headers },
  });
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProfiles: () => fetch(`${BASE}/profiles`).then((r) => json<Profile[]>(r)),

  getProfile: (profileId: string) =>
    fetch(`${BASE}/profiles/${profileId}`).then((r) => json<Profile>(r)),

  editProfile: (profileId: string, payload: ProfileEditInput) =>
    fetch(`${BASE}/profiles/${profileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => json<Profile>(r)),

  getSpendSummary: (profileId: string, days = 30) =>
    fetch(`${BASE}/profiles/${profileId}/spend-summary?days=${days}`).then((r) =>
      json<SpendSaveSummary>(r)
    ),

  linkBank: (profileId: string) =>
    fetch(`${BASE}/profiles/${profileId}/banks/link`, { method: "POST" }).then((r) =>
      json<LinkBankResponse>(r)
    ),

  createGoal: (profileId: string, payload: GoalCreateInput) =>
    fetch(`${BASE}/profiles/${profileId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => json<Goal>(r)),

  getTimeline: (profileId: string, goalId: string, lever: number) =>
    fetch(`${BASE}/profiles/${profileId}/goals/${goalId}/timeline?lever=${lever}`).then((r) =>
      json<TimelineResult>(r)
    ),

  getHabits: (profileId: string) =>
    fetch(`${BASE}/profiles/${profileId}/habits`).then((r) => json<HabitEntry[]>(r)),

  toggleHabit: (profileId: string, habitId: string, goalId: string, lever: number) =>
    fetch(
      `${BASE}/profiles/${profileId}/habits/${habitId}/toggle?goal_id=${goalId}&lever=${lever}`,
      { method: "POST" }
    ).then((r) => json<HabitToggleResponse>(r)),

  addCustomHabit: (profileId: string, goalId: string, lever: number, input: CustomHabitInput) =>
    fetch(`${BASE}/profiles/${profileId}/habits/custom?goal_id=${goalId}&lever=${lever}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<HabitToggleResponse>(r)),

  editGoal: (profileId: string, goalId: string, payload: GoalEditInput) =>
    fetch(`${BASE}/profiles/${profileId}/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => json<Goal>(r)),

  completeGoal: (profileId: string, goalId: string) =>
    fetch(`${BASE}/profiles/${profileId}/goals/${goalId}/complete`, {
      method: "POST",
    }).then((r) => json<GoalCompleteResponse>(r)),

  getAIHabits: (profileId: string, goalId: string) =>
    fetch(`${BASE}/profiles/${profileId}/ai-habits/${goalId}`).then((r) =>
      json<AIHabitSuggestion[]>(r)
    ),

  narratePlan: (profileId: string, goalId: string) =>
    fetch(`${BASE}/profiles/${profileId}/ai-habits/${goalId}/narrate`, { method: "POST" }).then(
      (r) => json<{ narration: string }>(r)
    ),

  getAIStatus: () =>
    fetch(`${BASE}/ai/status`).then((r) =>
      json<{ narrationAvailable: boolean; llmEnhanced: boolean }>(r)
    ),

  seedDemo: () =>
    fetch(`${BASE}/demo/seed`, { method: "POST" }).then((r) => json<{ added: number }>(r)),

  resetDemo: () => fetch(`${BASE}/demo/reset`, { method: "POST" }).then((r) => json<{ status: string }>(r)),

  getPayload: () =>
    fetch(`${BASE}/payload`).then((r) =>
      json<{ rewardRules: RewardRules; banks: Bank[]; habitLibrary: HabitLibraryEntry[] }>(r)
    ),

  login: (name: string) =>
    fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => json<LoginResponse>(r)),

  signup: (payload: SignupInput) =>
    fetch(`${BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => json<LoginResponse>(r)),

  getSavingsHistory: (profileId: string, goalId: string, lever: number) =>
    fetch(`${BASE}/profiles/${profileId}/goals/${goalId}/savings-history?lever=${lever}`).then((r) =>
      json<SavingsHistoryPoint[]>(r)
    ),

  claimReward: (profileId: string, tierPoints: number) =>
    fetch(`${BASE}/profiles/${profileId}/rewards/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierPoints }),
    }).then((r) => json<ClaimRewardResponse>(r)),
};
