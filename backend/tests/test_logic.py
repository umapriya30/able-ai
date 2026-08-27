import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import store  # noqa: E402
from logic import WEEKS_PER_MONTH, award_goal_completion, compute_timeline  # noqa: E402
from models import Points  # noqa: E402


@pytest.fixture(autouse=True)
def reset_store():
    store.reset_all()
    yield
    store.reset_all()


def maya():
    return store.get_profile("u_maya")


def maya_goal():
    profile = maya()
    return store.get_goal(profile, "g_deposit")


def test_weeks_per_month_constant():
    assert WEEKS_PER_MONTH == 4.345


def test_baseline_timeline_matches_contract_maths():
    profile, goal = maya(), maya_goal()
    result = compute_timeline(
        profile, goal, goal.targetAmount, goal.idealTimeframeMonths,
        ticked_habit_weekly_total=0, lever=0,
    )
    baseline_weekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH
    remaining = goal.targetAmount - goal.saved
    import math

    assert result.weekly == pytest.approx(baseline_weekly, abs=0.01)
    assert result.weeks == math.ceil(remaining / baseline_weekly)
    assert result.baseWeeks == result.weeks
    assert result.zeroLeftover is False


def test_zero_leftover_never_shows_infinity():
    profile, goal = maya(), maya_goal()
    baseline_weekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH
    result = compute_timeline(
        profile, goal, goal.targetAmount, goal.idealTimeframeMonths,
        ticked_habit_weekly_total=0, lever=-baseline_weekly,  # cancel it out to <= 0
    )
    assert result.zeroLeftover is True
    assert result.weeks is None
    assert result.message is not None
    assert "nothing left over" in result.message


def test_weeks_always_ceiled_never_floored():
    profile, goal = maya(), maya_goal()
    result = compute_timeline(profile, goal, 1000, 12, ticked_habit_weekly_total=0, lever=0)
    baseline_weekly = profile.savings.monthlyAverage / WEEKS_PER_MONTH
    remaining = 1000 - goal.saved
    exact = remaining / baseline_weekly
    assert result.weeks >= exact  # never rounds down
    assert result.weeks == pytest.approx(exact, abs=1) or result.weeks > exact


def test_off_track_goal_shows_nearest_achievable_message():
    profile, goal = maya(), maya_goal()
    # A very tight timeframe the baseline rate can't hit
    result = compute_timeline(
        profile, goal, goal.targetAmount, ideal_timeframe_months=1,
        ticked_habit_weekly_total=0, lever=0,
    )
    assert result.onTrack is False
    assert result.message is not None
    assert "needs" in result.message


def test_habit_ticks_shorten_the_timeline():
    profile, goal = maya(), maya_goal()
    baseline = compute_timeline(
        profile, goal, goal.targetAmount, goal.idealTimeframeMonths, 0, 0
    )
    with_habit = compute_timeline(
        profile, goal, goal.targetAmount, goal.idealTimeframeMonths,
        ticked_habit_weekly_total=10.5, lever=0,
    )
    assert with_habit.weeks < baseline.weeks
    assert with_habit.saved > 0


def test_goal_reward_capped_once_per_month():
    points = Points(balance=140, lifetime=340, lastGoalRewardAt=None)
    points, capped = award_goal_completion(points, goal_completion_points=100)
    assert capped is False
    assert points.balance == 240

    points, capped = award_goal_completion(points, goal_completion_points=100)
    assert capped is True
    assert points.balance == 240  # unchanged — no double award


def test_habit_points_uncapped_and_small():
    curated = store.PAYLOAD.habitLibrary
    for habit in curated:
        assert 5 <= habit.points <= 25


# --- v1.1 contract additions -------------------------------------------------


def test_target_date_converts_to_months_on_the_same_constant():
    from datetime import date

    from logic import DAYS_PER_MONTH, months_from_target_date

    today = date(2026, 8, 27)
    assert months_from_target_date("2027-08-27", today) == round(365 / DAYS_PER_MONTH, 2)
    # a date already gone is a tight goal, never a zero or negative timeframe
    assert months_from_target_date("2026-08-01", today) == 0.25


def test_reductive_explanation_quotes_the_users_own_category_spend():
    from logic import explain_habit

    profile = maya()
    habit = next(h for h in store.PAYLOAD.habitLibrary if h.habitId == "h_coffee")
    text = explain_habit(profile, habit)
    assert "£72/month" in text  # Maya's actual coffee & snacks line
    assert "£10.50 a week" in text


def test_productive_habits_name_no_product_and_no_rate():
    """docs/03 §3.5 — no advice strings, never a product or rate. The
    productive half of the Action Center is where that rule is easiest to
    break, so it's asserted rather than trusted."""
    from logic import explain_habit

    profile = maya()
    banned = ("isa", "%", "you should", "interest", "bonus rate")
    for habit in store.PAYLOAD.habitLibrary:
        if habit.kind != "productive":
            continue
        text = (habit.label + " " + explain_habit(profile, habit)).lower()
        assert not any(word in text for word in banned), habit.habitId


def test_spend_save_split_is_the_payloads_own_monthly_figures():
    from logic import DAYS_PER_MONTH, spend_save_split

    profile = maya()
    spent, saved = spend_save_split(profile, 30)
    scale = 30 / DAYS_PER_MONTH
    assert spent == pytest.approx(profile.spending.monthlyTotal * scale, abs=0.01)
    assert saved == pytest.approx(profile.savings.monthlyAverage * scale, abs=0.01)


def test_reward_ladder_runs_at_one_rate():
    rules = store.PAYLOAD.rewardRules
    for tier in rules.pointsToRewardTiers:
        assert tier.points / tier.amountGBP == rules.pointsPerGBP
        assert tier.fundedBy == "partner_education_budget"


def test_every_profile_points_at_a_real_partner_bank():
    bank_ids = {b.bankId for b in store.PAYLOAD.banks}
    assert bank_ids == {"natwest", "clearbank", "allica"}
    for profile in store.PAYLOAD.profiles:
        assert profile.bankId in bank_ids
        assert profile.linkedBankIds and set(profile.linkedBankIds) <= bank_ids
