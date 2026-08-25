import uuid

from fastapi import APIRouter, HTTPException

import store
from logic import award_goal_completion, compute_savings_history, compute_timeline
from models import (
    ClaimRewardRequest,
    ClaimRewardResponse,
    CustomHabitInput,
    Goal,
    GoalCompleteResponse,
    GoalEditInput,
    HabitLibraryEntry,
    HabitToggleResponse,
    LoginRequest,
    LoginResponse,
    Points,
    Profile,
    SavingsHistoryPoint,
    SignupRequest,
    TimelineResult,
)
from persona_generator import build_signup_profile, generate_profile

router = APIRouter(tags=["profiles"])


def _profile_or_404(profile_id: str) -> Profile:
    profile = store.get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _goal_or_404(profile: Profile, goal_id: str) -> Goal:
    goal = store.get_goal(profile, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


def _custom_habit_points(weekly_saving: float) -> int:
    """Flat-ish point value for a user-authored habit, capped so a made-up
    saving figure can't be typed in to farm points — same spirit as the
    flat 12 points ai_habits.py awards its own generated suggestions."""
    return max(10, min(30, round(weekly_saving)))


def _ticked_weekly_total(profile_id: str, profile: Profile) -> float:
    ticked = store.TICKED_HABITS.get(profile_id, set())
    total = 0.0
    for habit in store.PAYLOAD.habitLibrary:
        if habit.habitId in ticked and profile.persona in habit.personas:
            total += habit.weeklySaving
    for habit in store.CUSTOM_HABITS.get(profile_id, []):
        if habit.habitId in ticked:
            total += habit.weeklySaving
    # AI-generated habits (habitId prefixed "ai_") are tracked the same way
    # but aren't in the curated library, so recompute their saving from the
    # profile's own spending categories the same way ai_habits.py does.
    from ai_habits import generate_ai_habits

    if any(h.startswith("ai_") for h in ticked):
        for goal in profile.goals:
            label, target, ideal = store.effective_goal_fields(goal)
            for suggestion in generate_ai_habits(
                store.PAYLOAD, profile, goal, target, ideal, ticked_habit_ids=set()
            ):
                if suggestion.habit.habitId in ticked:
                    total += suggestion.habit.weeklySaving
    return total


def _apply_rewards_credit(patched: Profile) -> Profile:
    """Claimed reward tiers show up as real money on the account — the first
    account balance is bumped by whatever's been credited this session, so
    'funded by your bank' is a number the user can see move, not just a
    line of copy (docs/03: rewards come from the partner bank's education
    budget, not the user's own savings)."""
    credited = patched.points.rewardsCreditedGBP
    if credited and patched.accounts:
        patched.accounts[0].balance = round(patched.accounts[0].balance + credited, 2)
    return patched


@router.get("/profiles", response_model=list[Profile])
def list_profiles() -> list[Profile]:
    profiles = []
    for profile in store.all_profiles():
        patched = profile.model_copy(deep=True)
        patched.points = store.POINTS.get(profile.userId, profile.points)
        profiles.append(_apply_rewards_credit(patched))
    return profiles


@router.post("/signup", response_model=LoginResponse)
def signup(payload: SignupRequest) -> LoginResponse:
    if not any(b.bankId == payload.bankId for b in store.PAYLOAD.banks):
        raise HTTPException(status_code=422, detail="Unknown bankId")
    if payload.targetAmount <= 0:
        raise HTTPException(status_code=422, detail="targetAmount must be greater than 0")
    if payload.monthlyIncome <= 0:
        raise HTTPException(status_code=422, detail="monthlyIncome must be greater than 0")
    if not (18 <= payload.age <= 25):
        raise HTTPException(status_code=422, detail="age must be between 18 and 25")

    new_profile = build_signup_profile(payload, store.PAYLOAD)
    store.persist_profile(new_profile)

    if payload.initialHabitIds or payload.customHabits:
        ticked = store.TICKED_HABITS[new_profile.userId]
        points = store.POINTS[new_profile.userId]
        curated = {h.habitId: h for h in store.PAYLOAD.habitLibrary if new_profile.persona in h.personas}
        for habit_id in payload.initialHabitIds:
            habit = curated.get(habit_id)
            if habit and habit_id not in ticked:
                ticked.add(habit_id)
                points.balance += habit.points
                points.lifetime += habit.points

        for custom in payload.customHabits:
            label = custom.label.strip()
            if not label or custom.weeklySaving <= 0:
                continue
            habit = HabitLibraryEntry(
                habitId=f"custom_{uuid.uuid4().hex[:8]}",
                label=label,
                categoryId="custom",
                weeklySaving=round(custom.weeklySaving, 2),
                points=_custom_habit_points(custom.weeklySaving),
                personas=[new_profile.persona],
                generated=False,
            )
            store.CUSTOM_HABITS[new_profile.userId].append(habit)
            ticked.add(habit.habitId)
            points.balance += habit.points
            points.lifetime += habit.points

        new_profile.points = points

    return LoginResponse(profile=new_profile, isNew=True)


@router.get("/profiles/search", response_model=list[Profile])
def search_profiles(q: str = "") -> list[Profile]:
    needle = q.strip().lower()
    matches = [p for p in store.all_profiles() if not needle or needle in p.displayName.lower()]
    return matches[:30]


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    existing = store.find_profile_by_name(payload.name)
    if existing is not None:
        return LoginResponse(profile=existing, isNew=False)

    new_profile = generate_profile(payload.name, store.PAYLOAD)
    store.register_generated_profile(new_profile)
    return LoginResponse(profile=new_profile, isNew=True)


@router.get("/profiles/{profile_id}", response_model=Profile)
def get_profile(profile_id: str) -> Profile:
    profile = _profile_or_404(profile_id)
    patched = profile.model_copy(deep=True)
    patched.points = store.POINTS[profile_id]
    for goal in patched.goals:
        goal.label, goal.targetAmount, goal.idealTimeframeMonths = store.effective_goal_fields(goal)
        goal.saved = store.effective_saved(goal)
    return _apply_rewards_credit(patched)


@router.get("/profiles/{profile_id}/goals/{goal_id}/savings-history", response_model=list[SavingsHistoryPoint])
def get_savings_history(profile_id: str, goal_id: str, lever: float = 0.0) -> list[SavingsHistoryPoint]:
    profile = _profile_or_404(profile_id)
    _goal_or_404(profile, goal_id)
    ticked_total = _ticked_weekly_total(profile_id, profile)
    return compute_savings_history(profile, ticked_total, lever)


@router.post("/profiles/{profile_id}/rewards/claim", response_model=ClaimRewardResponse)
def claim_reward(profile_id: str, payload: ClaimRewardRequest) -> ClaimRewardResponse:
    profile = _profile_or_404(profile_id)
    tier = next((t for t in store.PAYLOAD.rewardRules.pointsToRewardTiers if t.points == payload.tierPoints), None)
    if tier is None:
        raise HTTPException(status_code=404, detail="Reward tier not found")

    points = store.POINTS[profile_id]
    bank = next((b for b in store.PAYLOAD.banks if b.bankId == profile.bankId), None)
    bank_name = bank.displayName if bank else "your bank"

    if tier.points in points.claimedTierPoints:
        return ClaimRewardResponse(
            tier=tier, points=points, creditedGBP=0.0, bankName=bank_name, alreadyClaimed=True,
            message=f"Already claimed — {tier.reward} only credits once.",
        )
    if points.balance < tier.points:
        raise HTTPException(status_code=400, detail="Not enough points for this tier yet")

    points.claimedTierPoints.append(tier.points)
    points.rewardsCreditedGBP = round(points.rewardsCreditedGBP + tier.amountGBP, 2)

    return ClaimRewardResponse(
        tier=tier, points=points, creditedGBP=tier.amountGBP, bankName=bank_name, alreadyClaimed=False,
        message=f"£{tier.amountGBP:.0f} credited from {bank_name}'s education budget.",
    )


@router.patch("/profiles/{profile_id}/goals/{goal_id}", response_model=Goal)
def edit_goal(profile_id: str, goal_id: str, payload: GoalEditInput) -> Goal:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    if payload.targetAmount is not None and payload.targetAmount <= 0:
        raise HTTPException(status_code=422, detail="targetAmount must be greater than 0")

    store.GOAL_OVERRIDES[goal_id] = payload
    label, target, ideal = store.effective_goal_fields(goal)
    patched = goal.model_copy()
    patched.label, patched.targetAmount, patched.idealTimeframeMonths = label, target, ideal
    return patched


@router.get("/profiles/{profile_id}/goals/{goal_id}/timeline", response_model=TimelineResult)
def get_timeline(profile_id: str, goal_id: str, lever: float = 0.0) -> TimelineResult:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    label, target, ideal = store.effective_goal_fields(goal)
    ticked_total = _ticked_weekly_total(profile_id, profile)
    return compute_timeline(profile, goal, target, ideal, ticked_total, lever, saved_override=store.effective_saved(goal))


@router.get("/profiles/{profile_id}/habits")
def get_habits(profile_id: str, goal_id: str | None = None):
    profile = _profile_or_404(profile_id)
    ticked = store.TICKED_HABITS.get(profile_id, set())
    curated = [h for h in store.PAYLOAD.habitLibrary if profile.persona in h.personas]
    custom = store.CUSTOM_HABITS.get(profile_id, [])
    return [
        {"habit": habit, "ticked": habit.habitId in ticked}
        for habit in [*curated, *custom]
    ]


@router.post("/profiles/{profile_id}/habits/{habit_id}/toggle", response_model=HabitToggleResponse)
def toggle_habit(profile_id: str, habit_id: str, goal_id: str, lever: float = 0.0) -> HabitToggleResponse:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)

    habit = next((h for h in store.PAYLOAD.habitLibrary if h.habitId == habit_id), None)
    if habit is None:
        habit = next((h for h in store.CUSTOM_HABITS.get(profile_id, []) if h.habitId == habit_id), None)
    if habit is None:
        # not curated, not user-authored — must be an AI-generated suggestion
        from ai_habits import generate_ai_habits

        label, target, ideal = store.effective_goal_fields(goal)
        ai_suggestions = generate_ai_habits(
            store.PAYLOAD, profile, goal, target, ideal, ticked_habit_ids=set(), max_habits=10
        )
        match = next((s for s in ai_suggestions if s.habit.habitId == habit_id), None)
        if match is None:
            raise HTTPException(status_code=404, detail="Habit not found")
        habit = match.habit

    ticked_set = store.TICKED_HABITS.setdefault(profile_id, set())
    points = store.POINTS[profile_id]
    now_ticked = habit_id not in ticked_set

    if now_ticked:
        ticked_set.add(habit_id)
        points.balance += habit.points
        points.lifetime += habit.points
    else:
        ticked_set.discard(habit_id)
        points.balance = max(0, points.balance - habit.points)

    label, target, ideal = store.effective_goal_fields(goal)
    ticked_total = _ticked_weekly_total(profile_id, profile)
    timeline = compute_timeline(profile, goal, target, ideal, ticked_total, lever, saved_override=store.effective_saved(goal))

    return HabitToggleResponse(habit=habit, ticked=now_ticked, points=points, timeline=timeline)


@router.post("/profiles/{profile_id}/habits/custom", response_model=HabitToggleResponse)
def add_custom_habit(profile_id: str, payload: CustomHabitInput, goal_id: str, lever: float = 0.0) -> HabitToggleResponse:
    """Lets a user add their own habit any time, not just at signup — the
    escape hatch for personas like secondary_school whose curated library
    (and the AI generator, since it only fills gaps the curated set doesn't
    already cover) can run out of habits to tick entirely."""
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)

    label = payload.label.strip()
    if not label:
        raise HTTPException(status_code=422, detail="label is required")
    if payload.weeklySaving <= 0:
        raise HTTPException(status_code=422, detail="weeklySaving must be greater than 0")

    habit = HabitLibraryEntry(
        habitId=f"custom_{uuid.uuid4().hex[:8]}",
        label=label,
        categoryId="custom",
        weeklySaving=round(payload.weeklySaving, 2),
        points=_custom_habit_points(payload.weeklySaving),
        personas=[profile.persona],
        generated=False,
    )
    store.CUSTOM_HABITS.setdefault(profile_id, []).append(habit)

    ticked_set = store.TICKED_HABITS.setdefault(profile_id, set())
    ticked_set.add(habit.habitId)
    points = store.POINTS[profile_id]
    points.balance += habit.points
    points.lifetime += habit.points

    label2, target, ideal = store.effective_goal_fields(goal)
    ticked_total = _ticked_weekly_total(profile_id, profile)
    timeline = compute_timeline(profile, goal, target, ideal, ticked_total, lever, saved_override=store.effective_saved(goal))

    return HabitToggleResponse(habit=habit, ticked=True, points=points, timeline=timeline)


@router.post("/profiles/{profile_id}/goals/{goal_id}/complete", response_model=GoalCompleteResponse)
def complete_goal(profile_id: str, goal_id: str) -> GoalCompleteResponse:
    """'Reach the goal' has to actually reach it — not just award points
    while saved/pct/remaining sit frozen at whatever they were. Marks the
    goal saved == target for the rest of the session (store.GOAL_SAVED_OVERRIDES),
    so every screen that reads the goal afterward (GoalCard's progress bar,
    Timeline's remaining/weeks) shows 100% / £0 / 0 weeks, matching the
    celebration copy instead of contradicting it."""
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    points = store.POINTS[profile_id]

    updated_points, capped = award_goal_completion(
        points, store.PAYLOAD.rewardRules.goalCompletionPoints
    )
    store.POINTS[profile_id] = updated_points

    label, target, ideal = store.effective_goal_fields(goal)
    store.GOAL_SAVED_OVERRIDES[goal_id] = target
    reached_goal = goal.model_copy()
    reached_goal.saved = target

    message = (
        "One goal reward per month — you've already claimed this month's. Next one unlocks next month."
        if capped
        else f"+{store.PAYLOAD.rewardRules.goalCompletionPoints} points — goal reached!"
    )

    return GoalCompleteResponse(goal=reached_goal, points=updated_points, capped=capped, message=message)
