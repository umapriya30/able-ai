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
    # Set only when the user picked a calendar date instead of dragging the
    # months slider. idealTimeframeMonths stays canonical either way — the
    # date is converted on the way in (logic.months_from_target_date) and
    # kept here purely so the goal screen can show the date back to them.
    targetDate: Optional[str] = None


class Points(BaseModel):
    balance: int
    lifetime: int
    lastGoalRewardAt: Optional[str] = None
    claimedTierPoints: list[int] = []
    rewardsCreditedGBP: float = 0.0


class Preferences(BaseModel):
    notificationsEnabled: bool = True


class Profile(BaseModel):
    userId: str
    displayName: str
    age: int
    ageBand: str
    persona: Literal["young_professional", "secondary_school", "university_student", "gig_worker"]
    bankId: str  # the bank that routed this profile to us — never changes
    # Every bank the user has connected, primary first. Settings can add to
    # this ("Add new account"); bankId stays put so the funder named on the
    # rewards screen doesn't move under the user.
    linkedBankIds: list[str] = []
    accounts: list[AccountEntry]
    income: Income
    spending: Spending
    savings: Savings
    goals: list[Goal]
    points: Points
    preferences: Preferences = Preferences()


class HabitLibraryEntry(BaseModel):
    habitId: str
    label: str
    categoryId: str
    weeklySaving: float
    points: int
    personas: list[str]
    # reductive = spend less in a category they already spend in.
    # productive = move money that is already theirs somewhere it counts.
    # The Action Center shows both halves; the engine treats them identically
    # (both are £/week toward the goal), so this only drives grouping and copy.
    kind: Literal["reductive", "productive"] = "reductive"
    generated: bool = False  # True for AI-generated suggestions not in the curated library


class RewardTier(BaseModel):
    points: int
    reward: str
    amountGBP: float
    fundedBy: str


class RewardRules(BaseModel):
    goalCompletionPoints: int
    goalRewardCapPerMonth: int
    pointsPerGBP: int  # one rate the whole ladder: 100 points = £1.00 cash
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
    targetDate: Optional[str] = None  # ISO date; wins over idealTimeframeMonths when both are sent


class GoalCreateInput(BaseModel):
    """The Create Goal screen. Timeframe arrives one of two ways — the months
    slider or a calendar date — so both are optional here and exactly one is
    required (validated in the router, where the 422 copy lives)."""

    label: str
    emoji: str = "\U0001F3AF"
    targetAmount: float
    idealTimeframeMonths: Optional[float] = None
    targetDate: Optional[str] = None
    startingSaved: float = 0.0


class HabitToggleResponse(BaseModel):
    habit: HabitLibraryEntry
    ticked: bool
    explanation: str  # same dropdown body GET /habits returns for this row
    points: Points
    timeline: TimelineResult


class GoalCompleteResponse(BaseModel):
    goal: Goal
    points: Points
    capped: bool
    message: str


class AIHabitSuggestion(BaseModel):
    habit: HabitLibraryEntry
    rationale: str  # what it does to the goal: "Closes 6 weeks off Deposit fund."
    explanation: str  # where the money came from, in their own figures
    weeksSaved: int


class HabitEntry(BaseModel):
    """One row in the Action Center. explanation is the dropdown body — the
    working behind the number, read off this profile's own spending."""

    habit: HabitLibraryEntry
    ticked: bool
    explanation: str


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


class ProfileEditInput(BaseModel):
    displayName: Optional[str] = None
    notificationsEnabled: Optional[bool] = None


class LinkBankResponse(BaseModel):
    bank: Bank
    linkedBanks: list[Bank]


class SpendSaveSummary(BaseModel):
    """The dashboard donut: exact £ spent vs £ saved over the period, never
    just percentages. Two segments only — DonutSplit takes two (CLAUDE.md)."""

    periodDays: int
    spent: float
    saved: float
    total: float
    spentPct: int
    savedPct: int
    currency: str


class ClaimRewardRequest(BaseModel):
    tierPoints: int


class ClaimRewardResponse(BaseModel):
    tier: RewardTier
    points: Points
    creditedGBP: float
    bankName: str
    alreadyClaimed: bool
    message: str
