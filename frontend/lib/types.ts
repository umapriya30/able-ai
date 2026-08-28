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
  // Set only when the timeframe was picked on the calendar rather than the
  // months slider. idealTimeframeMonths stays canonical; this is for display.
  targetDate: string | null;
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

export interface Preferences {
  notificationsEnabled: boolean;
}

export interface Profile {
  userId: string;
  displayName: string;
  age: number;
  ageBand: string;
  persona: Persona;
  bankId: string; // the bank that routed this profile to us — never changes
  linkedBankIds: string[]; // every connected bank, primary first
  accounts: AccountEntry[];
  income: Income;
  spending: Spending;
  savings: Savings;
  goals: Goal[];
  points: Points;
  preferences: Preferences;
}

// reductive = spend less in a category they already spend in.
// productive = move money that is already theirs somewhere it counts.
export type HabitKind = "reductive" | "productive";

export interface HabitLibraryEntry {
  habitId: string;
  label: string;
  categoryId: string;
  weeklySaving: number;
  points: number;
  personas: string[];
  kind: HabitKind;
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
  pointsPerGBP: number; // one rate the whole ladder: 100 points = £1.00 cash
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
  explanation: string; // the dropdown body: where this money came from
}

export interface AIHabitSuggestion {
  habit: HabitLibraryEntry;
  rationale: string; // what it does to the goal
  explanation: string; // where the money came from
  weeksSaved: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatResponse {
  reply: string;
  suggestions: AIHabitSuggestion[];
}

export interface HabitToggleResponse {
  habit: HabitLibraryEntry;
  ticked: boolean;
  explanation: string;
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
  targetDate?: string; // ISO date; wins over idealTimeframeMonths when both are sent
}

// Timeframe arrives as the months slider OR a calendar date — send exactly one.
export interface GoalCreateInput {
  label: string;
  emoji?: string;
  targetAmount: number;
  idealTimeframeMonths?: number;
  targetDate?: string;
  startingSaved?: number;
}

export interface ProfileEditInput {
  displayName?: string;
  notificationsEnabled?: boolean;
}

export interface LinkBankResponse {
  bank: Bank;
  linkedBanks: Bank[];
}

// Dashboard donut — £ figures, not just percentages. Two segments only.
export interface SpendSaveSummary {
  periodDays: number;
  spent: number;
  saved: number;
  total: number;
  spentPct: number;
  savedPct: number;
  currency: string;
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
