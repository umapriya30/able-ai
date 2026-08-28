from fastapi import APIRouter, HTTPException

import store
from ai_habits import chat_about_habits, generate_ai_habits, llm_narration_available, narrate_plan
from models import AIChatRequest, AIChatResponse, AIHabitSuggestion

router = APIRouter(tags=["ai"])


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


@router.get("/profiles/{profile_id}/ai-habits/{goal_id}", response_model=list[AIHabitSuggestion])
def get_ai_habits(profile_id: str, goal_id: str) -> list[AIHabitSuggestion]:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    label, target, ideal = store.effective_goal_fields(goal)
    ticked = store.TICKED_HABITS.get(profile_id, set())
    return generate_ai_habits(store.PAYLOAD, profile, goal, target, ideal, ticked_habit_ids=ticked)


@router.get("/ai/status")
def ai_status() -> dict[str, bool]:
    # Narration is always available (deterministic template, no key needed);
    # llmEnhanced reports whether the warmer LLM-written version is active.
    return {"narrationAvailable": True, "llmEnhanced": llm_narration_available()}


@router.post("/profiles/{profile_id}/ai-habits/{goal_id}/narrate")
def narrate(profile_id: str, goal_id: str) -> dict[str, str]:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    label, target, ideal = store.effective_goal_fields(goal)
    ticked = store.TICKED_HABITS.get(profile_id, set())
    suggestions = generate_ai_habits(store.PAYLOAD, profile, goal, target, ideal, ticked_habit_ids=ticked)
    return {"narration": narrate_plan(profile, goal, suggestions)}


@router.post("/profiles/{profile_id}/ai-habits/{goal_id}/chat", response_model=AIChatResponse)
def chat(profile_id: str, goal_id: str, body: AIChatRequest) -> AIChatResponse:
    profile = _profile_or_404(profile_id)
    goal = _goal_or_404(profile, goal_id)
    label, target, ideal = store.effective_goal_fields(goal)
    ticked = store.TICKED_HABITS.get(profile_id, set())
    reply, suggestions = chat_about_habits(
        store.PAYLOAD, profile, goal, target, ideal,
        ticked_habit_ids=ticked, message=body.message, history=body.history,
    )
    return AIChatResponse(reply=reply, suggestions=suggestions)
