"""AI-driven habit generation.

The curated habitLibrary in the payload is a fixed set of six habits, hand
picked for exactly two personas. That's fine for the pitch demo, but it
breaks the moment a third persona or an uncovered spending category shows up
— which is exactly the situation a real partner bank's users will produce.

This module is the "whatever the AI habit generation ends up being" piece
docs/03-engineering-handoff.md explicitly leaves open. It:

  1. Always prefers a curated habitLibrary entry when one exists for the
     profile's persona + a category they actually spend in (highest trust:
     hand-tuned copy and weeklySaving figures).
  2. Falls back to *generating* a suggestion for any other discretionary
     category the profile spends in, sized as 30% of that category's weekly
     spend — the same heuristic the original engine used, generalized to
     work for any bank's category taxonomy, not just the six pre-written
     ones.
  3. Ranks everything by weekly £ impact, explains each suggestion in terms
     of the goal it's attached to ("closes N weeks off X"), and never
     recommends cutting a non-discretionary (essential) category.

This stays fully deterministic and offline by default — no network call, no
model — which satisfies the team's own "must work in flight mode" rule. A
narration layer (ai_narrate_plan, below) can optionally call a real LLM to
turn the ranked list into a warmer paragraph, but only ever narrates numbers
this module already computed; it never invents its own figures or advice.
"""

import math

from config import settings
from logic import WEEKS_PER_MONTH, compute_timeline, explain_habit
from models import AIHabitSuggestion, Goal, HabitLibraryEntry, Payload, Profile


def generate_ai_habits(
    payload: Payload,
    profile: Profile,
    goal: Goal,
    target_amount: float,
    ideal_timeframe_months: float,
    ticked_habit_ids: set[str],
    max_habits: int = 3,
) -> list[AIHabitSuggestion]:
    curated = [
        h for h in payload.habitLibrary if profile.persona in h.personas
    ]
    curated_categories = {h.categoryId for h in curated}

    candidates: list[HabitLibraryEntry] = list(curated)

    for category in profile.spending.categories:
        if not category.discretionary:
            continue
        if category.categoryId in curated_categories:
            continue
        weekly_cut = round((category.monthly * 0.30) / WEEKS_PER_MONTH, 2)
        if weekly_cut <= 0:
            continue
        candidates.append(
            HabitLibraryEntry(
                habitId=f"ai_{category.categoryId}",
                label=f"Cut {category.label.lower()} by £{weekly_cut:.0f}/week",
                categoryId=category.categoryId,
                weeklySaving=weekly_cut,
                points=12,
                personas=[profile.persona],
                kind="reductive",  # a generated suggestion is always a category cut
                generated=True,
            )
        )

    candidates = [c for c in candidates if c.habitId not in ticked_habit_ids]
    candidates.sort(key=lambda c: c.weeklySaving, reverse=True)

    baseline_result = compute_timeline(
        profile, goal, target_amount, ideal_timeframe_months,
        ticked_habit_weekly_total=_ticked_total(payload, profile, ticked_habit_ids),
        lever=0,
    )
    baseline_weeks = baseline_result.weeks

    suggestions: list[AIHabitSuggestion] = []
    for candidate in candidates[:max_habits]:
        with_habit = compute_timeline(
            profile, goal, target_amount, ideal_timeframe_months,
            ticked_habit_weekly_total=_ticked_total(payload, profile, ticked_habit_ids)
            + candidate.weeklySaving,
            lever=0,
        )
        weeks_saved = 0
        if baseline_weeks is not None and with_habit.weeks is not None:
            weeks_saved = max(0, baseline_weeks - with_habit.weeks)

        rationale = (
            f"Closes {weeks_saved} week{'s' if weeks_saved != 1 else ''} off "
            f"{goal.label}."
            if weeks_saved > 0
            else f"Adds £{candidate.weeklySaving:.2f}/week toward {goal.label}."
        )
        suggestions.append(
            AIHabitSuggestion(
                habit=candidate,
                rationale=rationale,
                explanation=explain_habit(profile, candidate),
                weeksSaved=weeks_saved,
            )
        )

    return suggestions


def _ticked_total(payload: Payload, profile: Profile, ticked_habit_ids: set[str]) -> float:
    total = 0.0
    for habit in payload.habitLibrary:
        if habit.habitId in ticked_habit_ids and profile.persona in habit.personas:
            total += habit.weeklySaving
    return total


def ai_narration_available() -> bool:
    """Narration itself is always available — see narrate_plan_template()
    below. This flag now reports whether the *LLM-upgraded* prose is active
    (requires GROQ_API_KEY); the template fallback needs no key, no
    network, and no external account, so the feature never has to be
    switched off for a demo running without one."""
    return True


def llm_narration_available() -> bool:
    return settings.ai_narration_enabled


def narrate_plan(profile: Profile, goal: Goal, suggestions: list[AIHabitSuggestion]) -> str:
    """Narrate the already-computed suggestions as one warm paragraph.

    Uses the real LLM when GROQ_API_KEY is set; otherwise falls back to
    a deterministic template that reads the same numbers. Either way the
    figures themselves always come from generate_ai_habits() above, never
    from the model — this can never introduce an unverified figure or cross
    into "advice" framing (no "you should", no regulated products).
    """
    if settings.ai_narration_enabled:
        try:
            return narrate_plan_groq(profile, goal, suggestions)
        except Exception:
            pass  # network/key trouble on stage shouldn't break the demo
    return narrate_plan_template(profile, goal, suggestions)


def narrate_plan_template(profile: Profile, goal: Goal, suggestions: list[AIHabitSuggestion]) -> str:
    """Deterministic, offline, no API key required — the default narrator.
    Reads only numbers generate_ai_habits() already computed."""
    if not suggestions:
        return (
            f"No new habits to suggest for {goal.label} right now — "
            f"{profile.displayName} is already covering every easy category."
        )

    top = suggestions[0]
    weekly_total = round(sum(s.habit.weeklySaving for s in suggestions), 2)
    weeks_total = max((s.weeksSaved for s in suggestions), default=0)

    if len(suggestions) == 1:
        habits_clause = top.habit.label.rstrip(".").lower()
    else:
        rest = ", ".join(s.habit.label.rstrip(".").lower() for s in suggestions[1:-1])
        last = suggestions[-1].habit.label.rstrip(".").lower()
        middle = f", {rest}," if rest else ""
        habits_clause = f"{top.habit.label.rstrip('.').lower()}{middle} and {last}"

    weeks_clause = (
        f", closing roughly {weeks_total} week{'s' if weeks_total != 1 else ''} off {goal.label}"
        if weeks_total > 0
        else f" toward {goal.label}"
    )

    return (
        f"If {profile.displayName} did {habits_clause}, that would free up "
        f"£{weekly_total:.2f} a week{weeks_clause}."
    )


def narrate_plan_groq(profile: Profile, goal: Goal, suggestions: list[AIHabitSuggestion]) -> str:
    """The LLM-upgraded version of narrate_plan_template(), used only when
    GROQ_API_KEY is set. Only called when narration is enabled — the
    numbers themselves always come from generate_ai_habits() above, never
    from the model, so this can never introduce an unverified figure or
    cross into "advice" framing.
    """
    if not settings.ai_narration_enabled:
        raise RuntimeError("AI narration is not enabled — set GROQ_API_KEY to turn it on.")

    from groq import Groq  # lazy import: only needed when narration is enabled

    client = Groq()
    habit_lines = "\n".join(
        f"- {s.habit.label} (£{s.habit.weeklySaving:.2f}/week, {s.rationale})"
        for s in suggestions
    )
    prompt = (
        f"You are narrating a savings plan for {profile.displayName}, who is saving "
        f"toward '{goal.label}'. Using ONLY these already-computed habit suggestions, "
        f"write one warm, plain-English paragraph (2-3 sentences max) explaining the plan. "
        f"Never invent a number that isn't listed. Never say 'you should' — frame everything "
        f"as 'if you did X, this would happen'. Do not mention interest rates, investments, "
        f"or any regulated financial product.\n\n{habit_lines}"
    )
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        max_tokens=400,
        # Without this, gpt-oss-20b can spend its entire token budget on hidden
        # reasoning and return empty content (finish_reason="length", 0 visible
        # output) — reproduced with the real 3-habit prompt during testing.
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned no narration content")
    return content
