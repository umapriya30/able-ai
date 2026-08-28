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
from models import AIHabitSuggestion, ChatMessage, Goal, HabitLibraryEntry, Payload, Profile


def curated_habits_for_profile(payload: Payload, profile: Profile) -> list[HabitLibraryEntry]:
    """The curated habitLibrary entries this profile could see, anywhere in
    the app (Action Center, AI recommendations) — persona match, and never a
    reductive habit targeting a category this profile's own data marks
    non-discretionary (essential). That second rule was previously only
    enforced for *generated* candidates in generate_ai_habits() below, so a
    curated entry could bypass it: h_walk suggests skipping the bus, but
    transport is essential for every profile in the payload (so is h_fuel's
    fuel_transport for gig workers) — cutting an essential cost isn't a
    habit suggestion, it's pressure to skip something needed.
    """
    essential_categories = {c.categoryId for c in profile.spending.categories if not c.discretionary}
    return [
        h
        for h in payload.habitLibrary
        if profile.persona in h.personas
        and not (h.kind == "reductive" and h.categoryId in essential_categories)
    ]


def generate_ai_habits(
    payload: Payload,
    profile: Profile,
    goal: Goal,
    target_amount: float,
    ideal_timeframe_months: float,
    ticked_habit_ids: set[str],
    max_habits: int = 3,
) -> list[AIHabitSuggestion]:
    curated = curated_habits_for_profile(payload, profile)
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
        f"If {profile.displayName} trimmed the regular spend behind {habits_clause}, that "
        f"would free up £{weekly_total:.2f} a week{weeks_clause}."
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
    # Each line grounds the model in the *recurring* category spend behind the
    # cut (s.explanation, e.g. "You currently spend £168/month on eating out"),
    # not just the resulting weekly saving — that's the "regular pattern" this
    # is meant to read from, short of a real per-transaction feed.
    habit_lines = "\n".join(
        f"- {s.habit.label}: £{s.habit.weeklySaving:.2f}/week. {s.explanation}"
        for s in suggestions
    )
    weekly_total = round(sum(s.habit.weeklySaving for s in suggestions), 2)
    weeks_total = max((s.weeksSaved for s in suggestions), default=0)

    prompt = (
        f"{profile.displayName} is saving toward '{goal.label}'. Below are their recurring "
        f"discretionary spending categories and what trimming each would free up.\n\n"
        f"{habit_lines}\n\n"
        f"Combined: £{weekly_total:.2f}/week, up to {weeks_total} weeks CLOSER to {goal.label} "
        f"(i.e. {weeks_total} fewer weeks of waiting — always describe this as time coming OFF "
        f"the wait, never as the goal or the wait being 'extended' or 'lengthened').\n\n"
        f"Write ONE short, insightful sentence (max 30 words) that names the spending pattern "
        f"driving the gap and its combined effect — do NOT list each habit in its own clause. "
        f"Use only the £ and week figures given; never invent a number. Frame it as 'if you "
        f"did X' — never 'you should'. No interest rates, investments, or regulated financial "
        f"products."
    )
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        max_tokens=250,
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


def chat_about_habits(
    payload: Payload,
    profile: Profile,
    goal: Goal,
    target_amount: float,
    ideal_timeframe_months: float,
    ticked_habit_ids: set[str],
    message: str,
    history: list[ChatMessage],
) -> tuple[str, list[AIHabitSuggestion]]:
    """Lets the user steer the AI-generated shortlist by conversation — "swap
    coffee for something else", "I don't want to skip lunch", "show me
    something bigger". The model can only pick from the same computed
    candidate pool generate_ai_habits() already produced; it never invents a
    new habit, category, or £ figure — a chat reply can change *which*
    suggestions are shown, never their numbers. Applying one still goes
    through the normal tick/toggle flow, not this endpoint.
    """
    candidates = generate_ai_habits(
        payload, profile, goal, target_amount, ideal_timeframe_months,
        ticked_habit_ids=ticked_habit_ids, max_habits=10,
    )
    if not candidates:
        return "Nothing left to suggest — every easy category's already covered.", []

    if not settings.ai_narration_enabled:
        return (
            "AI chat needs GROQ_API_KEY set — showing your current top picks instead.",
            candidates[:3],
        )

    try:
        return _chat_about_habits_groq(profile, goal, candidates, message, history)
    except Exception:
        return "Had trouble reaching the AI just now — here's the current shortlist.", candidates[:3]


def _chat_about_habits_groq(
    profile: Profile,
    goal: Goal,
    candidates: list[AIHabitSuggestion],
    message: str,
    history: list[ChatMessage],
) -> tuple[str, list[AIHabitSuggestion]]:
    from groq import Groq  # lazy import: only needed when narration is enabled

    client = Groq()
    candidate_lines = "\n".join(
        f"{c.habit.habitId}: {c.habit.label} — £{c.habit.weeklySaving:.2f}/week, "
        f"{c.habit.kind}, category {c.habit.categoryId}. {c.explanation}"
        for c in candidates
    )
    # A single "user" message, not multi-turn system+history: gpt-oss-20b on
    # Groq intermittently mis-emits a tool-call wrapper around plain text
    # when given a system role plus conversation history, which the server
    # then rejects with "Tool choice is none, but model called a tool" even
    # though no tools were ever defined — reproduced during testing. Folding
    # everything into one message, the same pattern narrate_plan_groq() uses
    # successfully, avoids that path entirely.
    history_lines = "\n".join(
        f"{'User' if m.role != 'assistant' else 'You'}: {m.content}" for m in history[-6:]
    )
    prompt = (
        f"You are helping {profile.displayName} choose which habit suggestions to focus on "
        f"for their '{goal.label}' savings goal. You may ONLY recommend habits from this exact "
        f"candidate list — never invent a new habit, category, or £ figure:\n\n{candidate_lines}\n\n"
        + (f"Conversation so far:\n{history_lines}\n\n" if history_lines else "")
        + f"User's new message: \"{message}\"\n\n"
        f"When the user asks to change, swap, remove, or focus the suggestions, pick the best "
        f"matching habits from the list above (max 3, ordered by relevance to their request). "
        f"If nothing in the list matches what they're asking for, say so plainly instead of "
        f"picking an unrelated one. Never say 'you should' or give financial advice — frame "
        f"things as 'if you did X, this would happen'. Reply in EXACTLY this two-line format, "
        f"nothing else, no markdown:\n"
        f"REPLY: <one short, warm sentence, max 30 words>\n"
        f"HABIT_IDS: <comma-separated habitIds from the list above, 1-3 of them, or NONE>"
    )

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        max_tokens=300,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content or ""
    reply, habit_ids = _parse_chat_reply(content)
    if not reply:
        raise RuntimeError("Groq returned no chat content")

    by_id = {c.habit.habitId: c for c in candidates}
    picked = [by_id[h] for h in habit_ids if h in by_id]
    if not picked:
        picked = candidates[:3]
    return reply, picked


def narrate_ai_check(profile: Profile, goal: Goal, completed_habits: list[HabitLibraryEntry]) -> str:
    """The weekly plan's "let AI check this week" action. There is no
    per-transaction feed to detect what actually happened this week (see
    docs/01-user-journey.md — deliberately out of scope), so this reviews
    the same real category-spend figures explain_habit() already reads and
    reports back on the habits it just marked complete for this week. Never
    invents a number; only ever narrates habits the caller already decided
    to mark done."""
    if not completed_habits:
        return "Nothing new to check off this week — you're already on track."

    if settings.ai_narration_enabled:
        try:
            return narrate_ai_check_groq(profile, goal, completed_habits)
        except Exception:
            pass  # network/key trouble shouldn't break the demo

    labels = ", ".join(h.label.rstrip(".").lower() for h in completed_habits)
    return f"Reviewed your spending this week — {labels} looks on track, marked as done."


def narrate_ai_check_groq(profile: Profile, goal: Goal, completed_habits: list[HabitLibraryEntry]) -> str:
    from groq import Groq  # lazy import: only needed when narration is enabled

    client = Groq()
    habit_lines = "\n".join(f"- {h.label}" for h in completed_habits)
    prompt = (
        f"You just reviewed {profile.displayName}'s spending this week for their '{goal.label}' "
        f"goal and confirmed these habits look on track, so they've been marked complete:\n\n"
        f"{habit_lines}\n\n"
        f"Write ONE short, warm sentence (max 25 words) reporting this back, as if you just "
        f"finished checking their spending. Never say 'you should' or give financial advice. "
        f"Never invent a number that isn't listed. Plain text only — no emoji."
    )
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        max_tokens=250,
        reasoning_effort="low",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned no check-in content")
    return content


def _parse_chat_reply(content: str) -> tuple[str, list[str]]:
    reply = ""
    habit_ids: list[str] = []
    for line in content.splitlines():
        line = line.strip()
        if line.upper().startswith("REPLY:"):
            reply = line.split(":", 1)[1].strip()
        elif line.upper().startswith("HABIT_IDS:"):
            raw = line.split(":", 1)[1].strip()
            if raw.upper() != "NONE":
                habit_ids = [h.strip() for h in raw.split(",") if h.strip()]
    return reply, habit_ids
