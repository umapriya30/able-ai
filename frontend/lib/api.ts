import type {
  Bank,
  ClaimRewardResponse,
  CustomHabitInput,
  GoalCompleteResponse,
  GoalEditInput,
  Goal,
  HabitEntry,
  HabitLibraryEntry,
  HabitToggleResponse,
  LoginResponse,
  Profile,
  RewardRules,
  SavingsHistoryPoint,
  SignupInput,
  TimelineResult,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
