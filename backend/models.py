from typing import Literal, Optional

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Payload shapes — mirror data/dummy-bank-payload.json field-for-field.
# This is the universal API contract: every partner bank routes data to Able
# AI in this shape. Do not add ad-hoc fields locally; the payload is the only
# source of truth for spending/income/savings/goals.
# ---------------------------------------------------------------------------


class Bank(BaseModel):
    bankId: str
    displayName: str
    consentGrantedAt: str
    scopes: list[str]


class AccountEntry(BaseModel):
    accountId: str
    type: str
    balance: float
    currency: str


class Income(BaseModel):
    monthlyNet: float
    paydayDayOfMonth: int
    confidence: str
    sources: Optional[list[str]] = None


class SpendingCategory(BaseModel):
    categoryId: str
    label: str
    monthly: float
    discretionary: bool


class Spending(BaseModel):
    monthlyTotal: float
    categories: list[SpendingCategory]


class Savings(BaseModel):
    monthlyAverage: float
    currentSaved: float


class Goal(BaseModel):
    goalId: str
    label: str
    emoji: str
    targetAmount: float
    saved: float
    idealTimeframeMonths: float
    createdAt: str


class Points(BaseModel):
    balance: int
    lifetime: int
    lastGoalRewardAt: Optional[str] = None
    claimedTierPoints: list[int] = []
    rewardsCreditedGBP: float = 0.0


class Profile(BaseModel):
    userId: str
    displayName: str
    age: int
    ageBand: str
    persona: Literal["young_professional", "secondary_school", "university_student", "gig_worker"]
    bankId: str
    accounts: list[AccountEntry]
    income: Income
    spending: Spending
    savings: Savings
    goals: list[Goal]
    points: Points


class HabitLibraryEntry(BaseModel):
    habitId: str
    label: str
    categoryId: str
    weeklySaving: float
    points: int
    personas: list[str]
    generated: bool = False  # True for AI-generated suggestions not in the curated library


class RewardTier(BaseModel):
    points: int
    reward: str
    amountGBP: float
    fundedBy: str


class RewardRules(BaseModel):
    goalCompletionPoints: int
    goalRewardCapPerMonth: int
    pointsToRewardTiers: list[RewardTier]


class Payload(BaseModel):
    schemaVersion: str
    banks: list[Bank]
    profiles: list[Profile]
    habitLibrary: list[HabitLibraryEntry]
    rewardRules: RewardRules


# ---------------------------------------------------------------------------
# Engine output — the contract in docs/03-engineering-handoff.md §2, verbatim
# field names, plus honest edge-case messaging (never render "∞").
# ---------------------------------------------------------------------------


class TimelineResult(BaseModel):
    weekly: float
    remaining: float
    weeks: Optional[int]  # None only when weekly <= 0 (the zero-leftover state)
    baseWeeks: Optional[int]
    idealWeeks: int
    saved: int
    pct: int
    onTrack: bool
    zeroLeftover: bool
    message: Optional[str] = None


class GoalEditInput(BaseModel):
    label: Optional[str] = None
    targetAmount: Optional[float] = None
    idealTimeframeMonths: Optional[float] = None


class HabitToggleResponse(BaseModel):
    habit: HabitLibraryEntry
    ticked: bool
    points: Points
    timeline: TimelineResult


class GoalCompleteResponse(BaseModel):
    goal: Goal
    points: Points
    capped: bool
    message: str


class AIHabitSuggestion(BaseModel):
    habit: HabitLibraryEntry
    rationale: str
    weeksSaved: int


class LoginRequest(BaseModel):
    name: str


class LoginResponse(BaseModel):
    profile: Profile
    isNew: bool


class CustomHabitInput(BaseModel):
    label: str
    weeklySaving: float


class SignupRequest(BaseModel):
    name: str
    age: int
    persona: Literal["young_professional", "secondary_school", "university_student", "gig_worker"]
    bankId: str
    monthlyIncome: float
    goalLabel: str
    goalEmoji: str = "\U0001F3AF"
    targetAmount: float
    idealTimeframeMonths: float
    startingSaved: float = 0.0
    initialHabitIds: list[str] = []
    customHabits: list[CustomHabitInput] = []


class SavingsHistoryPoint(BaseModel):
    weekLabel: str
    amount: float
    spent: float
    isCurrent: bool


class ClaimRewardRequest(BaseModel):
    tierPoints: int


class ClaimRewardResponse(BaseModel):
    tier: RewardTier
    points: Points
    creditedGBP: float
    bankName: str
    alreadyClaimed: bool
    message: str
