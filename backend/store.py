import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from models import GoalEditInput, HabitLibraryEntry, Payload, Points

DATA_FILE = Path(__file__).parent.parent / "data" / "dummy-bank-payload.json"

PAYLOAD: Payload

# Session-only state layered on top of the immutable payload. Per
# docs/03-engineering-handoff.md §2: "target means the payload value, unless
# the user has edited it this session" — so overrides live here, never
# written back into the payload file.
GOAL_OVERRIDES: dict[str, GoalEditInput] = {}  # keyed by goalId
GOAL_SAVED_OVERRIDES: dict[str, float] = {}  # keyed by goalId — set on goal completion
TICKED_HABITS: dict[str, set[str]] = {}  # keyed by profileId -> set of habitId
POINTS: dict[str, Points] = {}  # keyed by profileId, mutable copy of payload points
LEVER: dict[str, float] = {}  # keyed by profileId, £/week the user has dragged in

# User-authored habits (not in the curated library, not AI-generated) —
# typed in free-form at signup, e.g. "Skip Uber Eats twice a week". Kept
# per-profile so they behave like curated habits everywhere afterward:
# listed in GET /habits, counted in the weekly total, toggleable.
CUSTOM_HABITS: dict[str, list[HabitLibraryEntry]] = {}  # keyed by profileId

# Profiles created by logging in with a name that doesn't match any of the
# baked-in 50 (see routers/profiles.py POST /login). Session-only, on top of
# the immutable payload — same pattern as GOAL_OVERRIDES above.
GENERATED_PROFILES: dict = {}  # keyed by userId -> Profile


@dataclass
class WeeklyPlanState:
    """A real week-by-week checklist for a goal: totalWeeks separate weeks,
    each with its own completion state per habit — ticking a habit in week 1
    does not carry over to week 2, matching a real recurring habit tracker
    rather than the one-time "is this active" toggle TICKED_HABITS holds.
    Points are earned per week a habit is completed, on top of (not instead
    of) the ongoing weekly saving that habit already contributes via
    TICKED_HABITS/compute_timeline."""

    total_weeks: int
    habit_ids: list[str]
    completions: dict[int, set[str]] = field(default_factory=dict)  # weekNumber(1-indexed) -> {habitId}


WEEKLY_PLANS: dict[str, WeeklyPlanState] = {}  # keyed by f"{profileId}:{goalId}"


def load_payload() -> None:
    global PAYLOAD
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    PAYLOAD = Payload(**raw)


def reset_all() -> None:
    load_payload()
    GOAL_OVERRIDES.clear()
    GOAL_SAVED_OVERRIDES.clear()
    TICKED_HABITS.clear()
    POINTS.clear()
    LEVER.clear()
    GENERATED_PROFILES.clear()
    CUSTOM_HABITS.clear()
    WEEKLY_PLANS.clear()
    for profile in PAYLOAD.profiles:
        TICKED_HABITS[profile.userId] = set()
        POINTS[profile.userId] = profile.points.model_copy()
        LEVER[profile.userId] = 0.0
        CUSTOM_HABITS[profile.userId] = []


def all_profiles() -> list:
    return [*PAYLOAD.profiles, *GENERATED_PROFILES.values()]


def get_profile(profile_id: str):
    for profile in PAYLOAD.profiles:
        if profile.userId == profile_id:
            return profile
    return GENERATED_PROFILES.get(profile_id)


def find_profile_by_name(name: str):
    needle = name.strip().lower()
    if not needle:
        return None
    for profile in all_profiles():
        if profile.displayName.strip().lower() == needle:
            return profile
    return None


def _init_session_state(user_id: str, points: Points) -> None:
    TICKED_HABITS[user_id] = set()
    POINTS[user_id] = points.model_copy()
    LEVER[user_id] = 0.0
    CUSTOM_HABITS[user_id] = []


def register_generated_profile(profile) -> None:
    GENERATED_PROFILES[profile.userId] = profile
    _init_session_state(profile.userId, profile.points)


def persist_profile(profile) -> None:
    """Called from POST /signup — an explicitly created account joins the
    permanent 50-profile roster in data/dummy-bank-payload.json, not just
    this session's memory, so it survives a backend restart and shows up in
    'Find my account' for everyone afterward, same as Maya or Jayden."""
    PAYLOAD.profiles.append(profile)
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    raw["profiles"].append(json.loads(profile.model_dump_json()))
    DATA_FILE.write_text(json.dumps(raw, indent=2, ensure_ascii=False), encoding="utf-8")
    _init_session_state(profile.userId, profile.points)


def get_goal(profile, goal_id: str):
    for goal in profile.goals:
        if goal.goalId == goal_id:
            return goal
    return None


def effective_goal_fields(goal) -> tuple[str, float, float]:
    """Returns (label, targetAmount, idealTimeframeMonths) with any session
    override applied on top of the payload's original values."""
    override = GOAL_OVERRIDES.get(goal.goalId)
    label = goal.label
    target = goal.targetAmount
    ideal_months = goal.idealTimeframeMonths
    if override:
        if override.label is not None:
            label = override.label
        if override.targetAmount is not None:
            target = override.targetAmount
        if override.idealTimeframeMonths is not None:
            ideal_months = override.idealTimeframeMonths
    return label, target, ideal_months


def effective_target_date(goal) -> str | None:
    """The calendar date the user picked for this goal, if they used the date
    control rather than the months slider. Display only — idealTimeframeMonths
    (set from this date at write time) is what the engine reads."""
    override = GOAL_OVERRIDES.get(goal.goalId)
    if override and override.targetDate is not None:
        return override.targetDate
    return goal.targetDate


def effective_saved(goal) -> float:
    """The goal's saved amount, unless it's been marked reached this session
    (see routers/profiles.py complete_goal) — same override pattern as
    effective_goal_fields, kept separate because saved changes on a
    different trigger (completion) than label/target/timeframe edits."""
    return GOAL_SAVED_OVERRIDES.get(goal.goalId, goal.saved)


# The two goals the design boards show on Maya's dashboard: one comfortably
# ahead, one honestly out of reach. Session-only, appended through the same
# path a user would use, so the payload file stays the source of truth and the
# baked-in g_deposit (which the tests reference by id) is left alone.
DEMO_GOALS = [
    {
        "goalId": "g_house_deposit",
        "label": "House deposit",
        "emoji": "\U0001F3E0",
        "targetAmount": 13000.0,
        "saved": 0.0,
        "idealTimeframeMonths": 15,
    },
    {
        "goalId": "g_sneakers",
        "label": "Sneakers",
        "emoji": "\U0001F45F",
        "targetAmount": 180.0,
        "saved": 112.0,
        "idealTimeframeMonths": 1.6,
    },
]


def seed_demo_goals(profile_id: str = "u_maya") -> int:
    """Idempotent — adds any missing demo goal, never duplicates one."""
    profile = get_profile(profile_id)
    if profile is None:
        return 0
    from models import Goal

    existing = {g.goalId for g in profile.goals}
    added = 0
    for spec in DEMO_GOALS:
        if spec["goalId"] in existing:
            continue
        profile.goals.append(Goal(createdAt="2026-08-20T00:00:00Z", **spec))
        added += 1
    return added


def today_month_key() -> str:
    return date.today().strftime("%Y-%m")


def resolve_habit(profile, goal, habit_id: str) -> HabitLibraryEntry | None:
    """Finds a habit by id across all three places one can come from: the
    curated library, this profile's custom (free-typed) habits, or — if
    neither matches — the AI-generated candidate pool for this goal. Shared
    by the habit toggle endpoint and the weekly-plan endpoints so an
    AI-generated habitId resolves the same way in both."""
    habit = next((h for h in PAYLOAD.habitLibrary if h.habitId == habit_id), None)
    if habit is not None:
        return habit

    habit = next((h for h in CUSTOM_HABITS.get(profile.userId, []) if h.habitId == habit_id), None)
    if habit is not None:
        return habit

    from ai_habits import generate_ai_habits

    label, target, ideal = effective_goal_fields(goal)
    ai_suggestions = generate_ai_habits(PAYLOAD, profile, goal, target, ideal, ticked_habit_ids=set(), max_habits=10)
    match = next((s for s in ai_suggestions if s.habit.habitId == habit_id), None)
    return match.habit if match else None


reset_all()
