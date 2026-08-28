import math
import random
from datetime import date

from models import Goal, HabitLibraryEntry, Points, Profile, SavingsHistoryPoint, TimelineResult

# Contract constant — docs/03-engineering-handoff.md: "4.345 (not 4) matters;
# at 4 the numbers drift enough that a judge doing mental arithmetic catches
# it." 52 weeks / 12 months = 4.3333...; the team's figure (365.25/7/12) is
# used verbatim so this build never disagrees with the prototype or the deck.
WEEKS_PER_MONTH = 4.345


def compute_timeline(
    profile: Profile,
    goal: Goal,
    target_amount: float,
    ideal_timeframe_months: float,
    ticked_habit_weekly_total: float,
    lever: float,
    saved_override: float | None = None,
) -> TimelineResult:
    """Reference implementation of the engine in docs/03-engineering-handoff.md §2.

    baselineWeekly = monthlyAverageSaved / 4.345
    habitWeekly    = sum of weeklySaving for ticked habits
    weekly         = baselineWeekly + habitWeekly + lever
    weeks          = ceil(max(0, target - saved) / weekly)

    Edge cases (docs/01-user-journey.md §7):
      1. weekly <= 0 must never render "∞" — return weeks=None with the
         zero-leftover copy instead, plus how much habitLibrary suggestions
         could free up.
      2. A goal unreachable in its stated ideal timeframe is never hidden —
         show the honest number AND the nearest achievable version.
    """
    saved_amount = goal.saved if saved_override is None else saved_override
    baseline_weekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH
    weekly = baseline_weekly + ticked_habit_weekly_total + lever
    remaining = max(0.0, target_amount - saved_amount)
    ideal_weeks = round(ideal_timeframe_months * WEEKS_PER_MONTH)

    if weekly <= 0:
        free_up = _top_discretionary_weekly(profile, take=3)
        return TimelineResult(
            weekly=weekly,
            remaining=round(remaining, 2),
            weeks=None,
            baseWeeks=None,
            idealWeeks=ideal_weeks,
            saved=0,
            pct=_pct(saved_amount, target_amount),
            onTrack=False,
            zeroLeftover=True,
            message=(
                "At the moment there's nothing left over. Here are three "
                f"habits that free up £{free_up:.0f}/week — that's the first step."
            ),
        )

    weeks = math.ceil(remaining / weekly)
    base_weeks = math.ceil(remaining / baseline_weekly) if baseline_weekly > 0 else None
    saved_weeks = base_weeks - weeks if base_weeks is not None and weeks < base_weeks else 0
    on_track = weeks <= ideal_weeks

    message = None
    if not on_track and ideal_weeks > 0:
        needed_weekly = remaining / ideal_weeks
        message = (
            f"{ideal_timeframe_months:g} months needs £{needed_weekly:.0f}/week. "
            f"At £{weekly:.0f}/week you're there in {weeks} weeks."
        )

    return TimelineResult(
        weekly=round(weekly, 2),
        remaining=round(remaining, 2),
        weeks=weeks,
        baseWeeks=base_weeks,
        idealWeeks=ideal_weeks,
        saved=saved_weeks,
        pct=_pct(saved_amount, target_amount),
        onTrack=on_track,
        zeroLeftover=False,
        message=message,
    )


def _pct(saved: float, target: float) -> int:
    if target <= 0:
        return 0
    return min(100, round(saved / target * 100))


def _top_discretionary_weekly(profile: Profile, take: int = 3) -> float:
    """Used only for the zero-leftover copy: how much the top N discretionary
    categories could realistically free up per week if trimmed by 30%."""
    discretionary = [c for c in profile.spending.categories if c.discretionary]
    discretionary.sort(key=lambda c: c.monthly, reverse=True)
    weekly_cuts = [(c.monthly * 0.30) / WEEKS_PER_MONTH for c in discretionary[:take]]
    return sum(weekly_cuts)


def compute_savings_history(
    profile: Profile, ticked_habit_weekly_total: float, lever: float, weeks: int = 8
) -> list[SavingsHistoryPoint]:
    """Weekly saved amounts for the tracker chart. The past weeks are a
    deterministic, seeded-per-profile trend around the account's own
    monthlyAverage — reproducible on every reload, not fabricated fresh each
    call. The final point is not synthetic at all: it's this session's live
    weekly rate (baseline + ticked habits + lever), the same number the
    Timeline/Habits screens show, so the chart moves in step with the rest
    of the app instead of sitting frozen.

    Each week also carries a spent figure — a second seed (XORed, so it
    doesn't track the saved figure 1:1) jittered around the account's own
    weekly spend, so the chart can point at which week ran hottest relative
    to the account's own normal, not an arbitrary threshold. This week's
    spend responds to ticked habits the same way saved does: a habit is
    money not spent, so it nudges spend down as it nudges saved up."""
    rng = random.Random(hash(profile.userId) & 0xFFFFFFFF)
    spend_rng = random.Random((hash(profile.userId) ^ 0x5BD1E995) & 0xFFFFFFFF)
    baseline_weekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH
    baseline_weekly_spend = profile.spending.monthlyTotal / WEEKS_PER_MONTH
    points: list[SavingsHistoryPoint] = []
    for i in range(weeks - 1):
        amount = round(max(0.0, baseline_weekly * rng.uniform(0.55, 1.35)), 2)
        spent = round(max(0.0, baseline_weekly_spend * spend_rng.uniform(0.85, 1.20)), 2)
        points.append(
            SavingsHistoryPoint(weekLabel=f"W-{weeks - 1 - i}", amount=amount, spent=spent, isCurrent=False)
        )
    current_weekly = round(max(0.0, baseline_weekly + ticked_habit_weekly_total + lever), 2)
    current_spend = round(max(0.0, baseline_weekly_spend - ticked_habit_weekly_total), 2)
    points.append(
        SavingsHistoryPoint(weekLabel="This week", amount=current_weekly, spent=current_spend, isCurrent=True)
    )
    return points


DAYS_PER_MONTH = WEEKS_PER_MONTH * 7  # 30.415 — same constant, expressed in days


def months_from_target_date(target_date: str, today: date | None = None) -> float:
    """Calendar date -> idealTimeframeMonths, for the goal screen's second
    timeframe control (months slider OR pick a date). Converted here rather
    than stored as a date because every downstream figure — idealWeeks,
    onTrack, the rail's "Your date" tick — is already expressed in months, and
    two sources of truth for the same deadline is how they drift apart.

    Floored at 0.25 months (about a week): a date picked for tomorrow is a
    tight goal, not a divide-by-zero.
    """
    target = date.fromisoformat(target_date[:10])
    days = (target - (today or date.today())).days
    return max(0.25, round(days / DAYS_PER_MONTH, 2))


def explain_habit(profile: Profile, habit: HabitLibraryEntry) -> str:
    """The dropdown under a habit row: where the AI found this money, in the
    user's own figures. Stated as arithmetic on their spending, never as
    advice — no "you should", no product, no rate (docs/03 §3.5).
    """
    monthly = habit.weeklySaving * WEEKS_PER_MONTH
    category = next(
        (c for c in profile.spending.categories if c.categoryId == habit.categoryId), None
    )

    if category is not None:
        return (
            f"You currently spend £{category.monthly:.0f}/month on {category.label.lower()}. "
            f"This frees up £{monthly:.0f}/month — £{habit.weeklySaving:.2f} a week toward the goal."
        )

    if habit.kind == "productive":
        leftover = profile.income.monthlyNet - profile.spending.monthlyTotal - profile.savings.monthlyAverage
        if habit.categoryId == "idle_cash" and leftover > 0:
            return (
                f"£{leftover:.0f}/month is still sitting in your current account after spending "
                f"and saving. This moves £{monthly:.0f} of it across before the next month starts."
            )
        if habit.categoryId == "roundups":
            return (
                f"You make about £{profile.spending.monthlyTotal:.0f}/month of card payments. "
                f"Rounding each one up comes to roughly £{monthly:.0f}/month."
            )
        return (
            f"£{monthly:.0f}/month moved on payday, before the rest of the month reaches it — "
            f"£{habit.weeklySaving:.2f} a week toward the goal."
        )

    return f"Adds £{habit.weeklySaving:.2f} a week — £{monthly:.0f}/month toward the goal."


def spend_save_split(profile: Profile, period_days: int = 30) -> tuple[float, float]:
    """Exact £ spent vs £ saved over the period, for the dashboard donut.
    Scaled off the payload's own monthly figures rather than invented per-day
    transactions, so the two segments always add up to what the rest of the
    app shows."""
    scale = period_days / DAYS_PER_MONTH
    return (
        round(profile.spending.monthlyTotal * scale, 2),
        round(profile.savings.monthlyAverage * scale, 2),
    )


def month_key(d: date) -> str:
    return d.strftime("%Y-%m")


def award_goal_completion(points: Points, goal_completion_points: int) -> tuple[Points, bool]:
    """Returns (updated points, capped). Hard-capped at one goal reward per
    calendar month, keyed on lastGoalRewardAt — enforced here, not just in
    the UI, so it can't be farmed by replaying the request. The point value
    itself comes from the payload's rewardRules, not a local constant, so it
    can never drift from the contract."""
    today = date.today()
    this_month = month_key(today)
    last_reward_month = None
    if points.lastGoalRewardAt:
        try:
            last_reward_month = points.lastGoalRewardAt[:7]
        except (TypeError, IndexError):
            last_reward_month = None

    if last_reward_month == this_month:
        return points, True

    points.balance += goal_completion_points
    points.lifetime += goal_completion_points
    points.lastGoalRewardAt = today.isoformat()
    return points, False
