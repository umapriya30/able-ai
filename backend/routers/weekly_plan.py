from fastapi import APIRouter, HTTPException

import store
from logic import explain_habit
from models import (
    HabitEntry,
    WeeklyPlan,
    WeeklyPlanCreateInput,
    WeeklyPlanToggleResponse,
    WeeklyPlanWeek,
)

router = APIRouter(tags=["weekly-plan"])


def _profile_or_404(profile_id: str):
    profile = store.get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _goal_or_404(profile, goal_id: str):
    goal = store.get_goal(profile, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def _plan_key(profile_id: str, goal_id: str) -> str:
    return f"{profile_id}:{goal_id}"


def _build_plan(profile, goal, state: store.WeeklyPlanState) -> WeeklyPlan:
    habits = [store.resolve_habit(profile, goal, hid) for hid in state.habit_ids]
    weeks = []
    for week_number in range(1, state.total_weeks + 1):
        completed = state.completions.get(week_number, set())
        weeks.append(
            WeeklyPlanWeek(
                weekNumber=week_number,
                habits=[
                    HabitEntry(habit=habit, ticked=habit.habitId in completed, explanation=explain_habit(profile, habit))
                    for habit in habits
                    if habit is not None
                ],
            )
        )
    return WeeklyPlan(goalId=goal.goalId, totalWeeks=state.total_weeks, weeks=weeks)


@router.post("/profiles/{profile_id}/goals/{goal_id}/weekly-plan", response_model=WeeklyPlan)
def create_weekly_plan(profile_id: str, goal_id: str, body: WeeklyPlanCreateInput) -> WeeklyPlan:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    if body.totalWeeks < 1:
        raise HTTPException(status_code=422, detail="totalWeeks must be at least 1")

    state = store.WeeklyPlanState(total_weeks=body.totalWeeks, habit_ids=list(body.habitIds))
    store.WEEKLY_PLANS[_plan_key(profile_id, goal_id)] = state
    return _build_plan(profile, goal, state)


@router.get("/profiles/{profile_id}/goals/{goal_id}/weekly-plan", response_model=WeeklyPlan | None)
def get_weekly_plan(profile_id: str, goal_id: str) -> WeeklyPlan | None:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    state = store.WEEKLY_PLANS.get(_plan_key(profile_id, goal_id))
    if state is None:
        return None
    return _build_plan(profile, goal, state)


@router.post(
    "/profiles/{profile_id}/goals/{goal_id}/weekly-plan/weeks/{week_number}/habits/{habit_id}/toggle",
    response_model=WeeklyPlanToggleResponse,
)
def toggle_week_habit(profile_id: str, goal_id: str, week_number: int, habit_id: str) -> WeeklyPlanToggleResponse:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    state = store.WEEKLY_PLANS.get(_plan_key(profile_id, goal_id))
    if state is None:
        raise HTTPException(status_code=404, detail="No weekly plan for this goal yet")
    if not (1 <= week_number <= state.total_weeks):
        raise HTTPException(status_code=422, detail=f"week_number must be between 1 and {state.total_weeks}")
    if habit_id not in state.habit_ids:
        raise HTTPException(status_code=404, detail="Habit is not part of this plan")

    habit = store.resolve_habit(profile, goal, habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")

    completed = state.completions.setdefault(week_number, set())
    points = store.POINTS[profile_id]
    if habit_id in completed:
        completed.discard(habit_id)
        points.balance = max(0, points.balance - habit.points)
    else:
        completed.add(habit_id)
        points.balance += habit.points
        points.lifetime += habit.points

    return WeeklyPlanToggleResponse(plan=_build_plan(profile, goal, state), points=points)
