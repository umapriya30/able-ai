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
