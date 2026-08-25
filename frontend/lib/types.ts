// Mirrors backend/models.py field-for-field. Do not add fields locally —
// the payload/API is the only source of truth (docs/03-engineering-handoff.md §2).

export interface AccountEntry {
  accountId: string;
  type: string;
  balance: number;
  currency: string;
}

export interface Income {
  monthlyNet: number;
  paydayDayOfMonth: number;
  confidence: string;
  sources?: string[] | null;
}

export interface SpendingCategory {
  categoryId: string;
  label: string;
  monthly: number;
  discretionary: boolean;
}

export interface Spending {
  monthlyTotal: number;
  categories: SpendingCategory[];
}

export interface Savings {
  monthlyAverage: number;
  currentSaved: number;
}

export interface Goal {
  goalId: string;
  label: string;
  emoji: string;
  targetAmount: number;
  saved: number;
  idealTimeframeMonths: number;
  createdAt: string;
}

export interface Points {
  balance: number;
  lifetime: number;
  lastGoalRewardAt: string | null;
  claimedTierPoints: number[];
  rewardsCreditedGBP: number;
}

export type Persona = "young_professional" | "secondary_school" | "university_student" | "gig_worker";

export interface Bank {
  bankId: string;
  displayName: string;
  consentGrantedAt: string;
  scopes: string[];
}

export interface Profile {
  userId: string;
  displayName: string;
  age: number;
  ageBand: string;
  persona: Persona;
  bankId: string;
  accounts: AccountEntry[];
  income: Income;
  spending: Spending;
  savings: Savings;
  goals: Goal[];
  points: Points;
}

export interface HabitLibraryEntry {
  habitId: string;
  label: string;
  categoryId: string;
  weeklySaving: number;
  points: number;
  personas: string[];
  generated: boolean;
}

export interface RewardTier {
  points: number;
  reward: string;
  amountGBP: number;
  fundedBy: string;
}

export interface RewardRules {
  goalCompletionPoints: number;
  goalRewardCapPerMonth: number;
  pointsToRewardTiers: RewardTier[];
}

export interface TimelineResult {
  weekly: number;
  remaining: number;
  weeks: number | null;
  baseWeeks: number | null;
  idealWeeks: number;
  saved: number;
  pct: number;
  onTrack: boolean;
  zeroLeftover: boolean;
  message: string | null;
}

export interface HabitEntry {
  habit: HabitLibraryEntry;
  ticked: boolean;
}

export interface HabitToggleResponse {
  habit: HabitLibraryEntry;
  ticked: boolean;
  points: Points;
  timeline: TimelineResult;
}

export interface GoalCompleteResponse {
  goal: Goal;
  points: Points;
  capped: boolean;
  message: string;
}

export interface GoalEditInput {
  label?: string;
  targetAmount?: number;
  idealTimeframeMonths?: number;
}

export interface LoginResponse {
  profile: Profile;
  isNew: boolean;
}

export interface CustomHabitInput {
  label: string;
  weeklySaving: number;
}

export interface SignupInput {
  name: string;
  age: number;
  persona: Persona;
  bankId: string;
  monthlyIncome: number;
  goalLabel: string;
  goalEmoji?: string;
  targetAmount: number;
  idealTimeframeMonths: number;
  startingSaved?: number;
  initialHabitIds?: string[];
  customHabits?: CustomHabitInput[];
}

export interface SavingsHistoryPoint {
  weekLabel: string;
  amount: number;
  spent: number;
  isCurrent: boolean;
}

export interface ClaimRewardResponse {
  tier: RewardTier;
  points: Points;
  creditedGBP: number;
  bankName: string;
  alreadyClaimed: boolean;
  message: string;
}
