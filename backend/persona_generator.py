"""Generates a brand-new profile at login time for a name that doesn't match
any of the 50 baked-in profiles in the payload — jitters a random existing
profile's numbers rather than inventing a new shape, so the result always has
curated habitLibrary coverage (same persona = same categories = same habits)
and never drifts from the contract's field shapes.
"""

import random
import uuid

from models import Payload, Profile, SignupRequest


def generate_profile(display_name: str, payload: Payload) -> Profile:
    template = random.choice(payload.profiles)
    jitter = lambda v: round(v * random.uniform(0.7, 1.4), 2)

    data = template.model_dump()
    data["userId"] = f"u_gen_{uuid.uuid4().hex[:8]}"
    data["displayName"] = display_name.strip() or "Guest"
    data["age"] = max(18, min(25, template.age + random.randint(-3, 3)))
    data["bankId"] = random.choice(payload.banks).bankId

    data["income"]["monthlyNet"] = jitter(template.income.monthlyNet)

    for cat in data["spending"]["categories"]:
        cat["monthly"] = jitter(cat["monthly"])
    data["spending"]["monthlyTotal"] = round(sum(c["monthly"] for c in data["spending"]["categories"]), 2)

    data["savings"]["monthlyAverage"] = jitter(template.savings.monthlyAverage)
    data["savings"]["currentSaved"] = jitter(template.savings.currentSaved)

    goal = data["goals"][0]
    goal["goalId"] = f"g_{data['userId'].removeprefix('u_')}"
    goal["targetAmount"] = jitter(template.goals[0].targetAmount)
    goal["saved"] = round(min(jitter(template.goals[0].saved), goal["targetAmount"] * 0.85), 2)

    for account in data["accounts"]:
        account["accountId"] = f"acc_{data['userId'].removeprefix('u_')}_{account['type']}"
        account["balance"] = jitter(account["balance"])

    data["points"] = {"balance": 0, "lifetime": 0, "lastGoalRewardAt": None}

    return Profile(**data)


def build_signup_profile(signup: SignupRequest, payload: Payload) -> Profile:
    """Builds a profile from explicit user-entered fields (signup.name,
    persona, bankId, monthlyIncome, goal...) rather than random jitter.
    Spending category *shape* (which categories, what proportion of income
    each takes) is borrowed from an existing profile of the same persona —
    a person filling in a quick signup form wouldn't itemise every category
    by hand, but the shape has to come from somewhere real, not a guess.
    """
    template = random.choice([p for p in payload.profiles if p.persona == signup.persona])
    scale = signup.monthlyIncome / template.income.monthlyNet if template.income.monthlyNet else 1.0

    user_id = f"u_signup_{uuid.uuid4().hex[:8]}"
    categories = []
    for cat in template.spending.categories:
        categories.append({
            "categoryId": cat.categoryId,
            "label": cat.label,
            "monthly": round(cat.monthly * scale, 2),
            "discretionary": cat.discretionary,
        })
    monthly_total = round(sum(c["monthly"] for c in categories), 2)
    savings_monthly = round(template.savings.monthlyAverage * scale, 2)

    return Profile(
        userId=user_id,
        displayName=signup.name.strip() or "Guest",
        age=signup.age,
        ageBand=template.ageBand,
        persona=signup.persona,
        bankId=signup.bankId,
        accounts=[{
            "accountId": f"acc_{user_id.removeprefix('u_')}_current",
            "type": "current",
            "balance": round(signup.monthlyIncome * 0.4, 2),
            "currency": "GBP",
        }],
        income={
            "monthlyNet": signup.monthlyIncome,
            "paydayDayOfMonth": template.income.paydayDayOfMonth,
            "confidence": "high",
            **({"sources": template.income.sources} if template.income.sources else {}),
        },
        spending={"monthlyTotal": monthly_total, "categories": categories},
        savings={"monthlyAverage": savings_monthly, "currentSaved": signup.startingSaved},
        goals=[{
            "goalId": f"g_{user_id.removeprefix('u_')}",
            "label": signup.goalLabel,
            "emoji": signup.goalEmoji,
            "targetAmount": signup.targetAmount,
            "saved": min(signup.startingSaved, signup.targetAmount * 0.9),
            "idealTimeframeMonths": signup.idealTimeframeMonths,
            "createdAt": "2026-08-25T00:00:00Z",
        }],
        points={"balance": 0, "lifetime": 0, "lastGoalRewardAt": None},
    )
