"""Generates data/dummy-bank-payload.json: 50 profiles spread across 5 fictional
partner banks and 4 persona archetypes, plus an expanded habit library.

Run with: .venv/Scripts/python.exe scripts/generate_demo_data.py

Maya (u_maya) and Jayden (u_jayden) are preserved byte-for-byte in every field
the engine/tests depend on — only a new bankId is added to them — because
backend/tests/test_logic.py and the frontend both reference them by exact id
and figure. Everyone else is procedurally generated with a seeded RNG so the
file is reproducible (same output every run), not different demo data every
time someone re-runs the script.
"""

import json
import random
from pathlib import Path

OUT_FILE = Path(__file__).resolve().parents[2] / "data" / "dummy-bank-payload.json"

random.seed(7)

BANKS = [
    {"bankId": "demo-bank", "displayName": "Demo Bank", "consentGrantedAt": "2026-08-20T09:12:00Z", "scopes": ["accounts:read", "transactions:read"]},
    {"bankId": "northbridge", "displayName": "Northbridge Bank", "consentGrantedAt": "2026-08-19T11:04:00Z", "scopes": ["accounts:read", "transactions:read"]},
    {"bankId": "meridian-digital", "displayName": "Meridian Digital", "consentGrantedAt": "2026-08-21T08:47:00Z", "scopes": ["accounts:read", "transactions:read"]},
    {"bankId": "clearwater-cu", "displayName": "Clearwater Credit Union", "consentGrantedAt": "2026-08-18T14:30:00Z", "scopes": ["accounts:read", "transactions:read"]},
    {"bankId": "pinnacle-money", "displayName": "Pinnacle Money", "consentGrantedAt": "2026-08-22T10:15:00Z", "scopes": ["accounts:read", "transactions:read"]},
]

NAMES = [
    "Ava", "Liam", "Sofia", "Mason", "Freya", "Omar", "Grace", "Kwame", "Isla", "Ryan",
    "Amara", "Ethan", "Nadia", "Lucas", "Chloe", "Ola", "Dylan", "Yasmin", "Harry", "Mei",
    "Jack", "Aaliyah", "Finn", "Sana", "George", "Ruby", "Kai", "Amelia", "Theo", "Zainab",
    "Oscar", "Layla", "Arjun", "Hannah", "Mohammed", "Poppy", "Elijah", "Fatima", "Callum", "Sienna",
    "Rhys", "Aisha", "Toby", "Nia", "Felix", "Anya", "Marcus", "Ivy", "Kofi", "Willow",
    "Aryan", "Daisy", "Idris", "Robyn", "Hassan", "Betty", "Connor", "Priyanka",
]

ARCHETYPES = {
    "young_professional": {
        "ageBand": "18-25", "ageRange": (18, 25),
        "incomeRange": (1600, 2800), "confidence": "high", "sources": None,
        "categories": [
            ("rent", "Rent & bills", (0.45, 0.55), False),
            ("groceries", "Groceries", (0.10, 0.14), False),
            ("transport", "Transport", (0.04, 0.07), False),
            ("eating_out", "Eating out", (0.08, 0.12), True),
            ("coffee", "Coffee & snacks", (0.03, 0.05), True),
            ("subs", "Subscriptions", (0.02, 0.04), True),
            ("shopping", "Shopping", (0.04, 0.07), True),
        ],
        "savingsFraction": (0.06, 0.11), "savedWeeksRange": (2, 20),
        "goals": [
            ("Deposit fund", "\U0001F511", (10, 18), (2200, 6000)),
            ("Wedding fund", "\U0001F48D", (9, 15), (3000, 9000)),
            ("Travel fund", "✈️", (4, 9), (900, 2400)),
            ("New car", "\U0001F697", (8, 16), (2000, 6000)),
        ],
    },
    "secondary_school": {
        "ageBand": "18-25", "ageRange": (18, 25),
        "incomeRange": (80, 180), "confidence": "medium", "sources": ["part_time", "allowance"],
        "categories": [
            ("transport", "Bus & travel", (0.22, 0.32), False),
            ("lunch", "Lunch & snacks", (0.25, 0.35), True),
            ("gaming", "Games & in-app", (0.10, 0.20), True),
            ("subs", "Subscriptions", (0.10, 0.15), True),
        ],
        "savingsFraction": (0.25, 0.40), "savedWeeksRange": (2, 12),
        "goals": [
            ("Match boots", "⚽", (2, 5), (120, 260)),
            ("New phone", "\U0001F4F1", (3, 7), (200, 450)),
            ("Concert tickets", "\U0001F3AB", (1, 4), (60, 180)),
            ("Bike", "\U0001F6B2", (3, 6), (150, 350)),
        ],
    },
    "university_student": {
        "ageBand": "18-25", "ageRange": (18, 25),
        "incomeRange": (500, 900), "confidence": "medium", "sources": ["student_loan", "part_time"],
        "categories": [
            ("rent_bills", "Rent & bills", (0.45, 0.55), False),
            ("groceries", "Groceries", (0.12, 0.16), False),
            ("transport", "Transport", (0.03, 0.05), False),
            ("takeaways", "Takeaways", (0.08, 0.12), True),
            ("nights_out", "Nights out", (0.06, 0.10), True),
            ("subs", "Subscriptions", (0.03, 0.05), True),
            ("shopping", "Shopping", (0.02, 0.04), True),
        ],
        "savingsFraction": (0.08, 0.14), "savedWeeksRange": (2, 14),
        "goals": [
            ("New laptop", "\U0001F4BB", (4, 8), (650, 1200)),
            ("Study abroad trip", "\U0001F393", (6, 10), (1200, 2400)),
            ("Festival ticket", "\U0001F3AA", (2, 5), (150, 350)),
            ("Second-hand car", "\U0001F697", (6, 10), (1200, 2800)),
        ],
    },
    "gig_worker": {
        "ageBand": "18-25", "ageRange": (18, 25),
        "incomeRange": (1400, 2300), "confidence": "medium", "sources": ["gig_economy"],
        "categories": [
            ("rent_bills", "Rent & bills", (0.45, 0.55), False),
            ("fuel_transport", "Fuel & transport", (0.10, 0.15), False),
            ("groceries", "Groceries", (0.10, 0.14), False),
            ("takeaways", "Takeaways", (0.06, 0.10), True),
            ("subs", "Subscriptions", (0.03, 0.05), True),
            ("shopping", "Shopping", (0.05, 0.08), True),
        ],
        "savingsFraction": (0.05, 0.10), "savedWeeksRange": (4, 30),
        "goals": [
            ("Work van upgrade", "\U0001F690", (12, 24), (3000, 6000)),
            ("Emergency fund", "\U0001F6DF", (6, 14), (1000, 3000)),
            ("New equipment", "\U0001F6E0️", (5, 10), (800, 2200)),
            ("House deposit", "\U0001F511", (14, 24), (4000, 9000)),
        ],
    },
}

WEEKS_PER_MONTH = 4.345


def r2(v: float) -> float:
    return round(v, 2)


def gen_profile(user_id: str, name: str, persona: str, bank_id: str) -> dict:
    a = ARCHETYPES[persona]
    age = random.randint(*a["ageRange"])
    income = r2(random.uniform(*a["incomeRange"]))

    categories = []
    for cat_id, label, frac_range, discretionary in a["categories"]:
        monthly = r2(income * random.uniform(*frac_range))
        categories.append({"categoryId": cat_id, "label": label, "monthly": monthly, "discretionary": discretionary})
    monthly_total = r2(sum(c["monthly"] for c in categories))

    savings_monthly = r2(income * random.uniform(*a["savingsFraction"]))
    saved_weeks = random.uniform(*a["savedWeeksRange"])
    current_saved = r2((savings_monthly / WEEKS_PER_MONTH) * saved_weeks)

    goal_label, goal_emoji, months_range, target_range = random.choice(a["goals"])
    ideal_months = random.randint(*months_range)
    target_amount = r2(random.uniform(*target_range))
    goal_saved = r2(min(target_amount * random.uniform(0.05, 0.45), target_amount * 0.9))

    balance = r2(income * random.uniform(0.3, 0.9))
    account = {"accountId": f"acc_{user_id.removeprefix('u_')}_current", "type": "current", "balance": balance, "currency": "GBP"}

    return {
        "userId": user_id,
        "displayName": name,
        "age": age,
        "ageBand": a["ageBand"],
        "persona": persona,
        "bankId": bank_id,
        "accounts": [account],
        "income": {
            "monthlyNet": income,
            "paydayDayOfMonth": random.randint(1, 28),
            "confidence": a["confidence"],
            **({"sources": a["sources"]} if a["sources"] else {}),
        },
        "spending": {"monthlyTotal": monthly_total, "categories": categories},
        "savings": {"monthlyAverage": savings_monthly, "currentSaved": current_saved},
        "goals": [{
            "goalId": f"g_{user_id.removeprefix('u_')}",
            "label": goal_label,
            "emoji": goal_emoji,
            "targetAmount": target_amount,
            "saved": goal_saved,
            "idealTimeframeMonths": ideal_months,
            "createdAt": "2026-06-01T00:00:00Z",
        }],
        "points": {"balance": random.choice([0, 0, 20, 40, 60, 90]), "lifetime": 0, "lastGoalRewardAt": None},
    }


MAYA = {
    "userId": "u_maya", "displayName": "Maya", "age": 23, "ageBand": "18-25",
    "persona": "young_professional", "bankId": "demo-bank",
    "accounts": [
        {"accountId": "acc_maya_current", "type": "current", "balance": 1284.5, "currency": "GBP"},
        {"accountId": "acc_maya_savings", "type": "savings", "balance": 640.0, "currency": "GBP"},
    ],
    "income": {"monthlyNet": 1980.0, "paydayDayOfMonth": 25, "confidence": "high"},
    "spending": {
        "monthlyTotal": 1642.0,
        "categories": [
            {"categoryId": "rent", "label": "Rent & bills", "monthly": 950.0, "discretionary": False},
            {"categoryId": "groceries", "label": "Groceries", "monthly": 210.0, "discretionary": False},
            {"categoryId": "transport", "label": "Transport", "monthly": 96.0, "discretionary": False},
            {"categoryId": "eating_out", "label": "Eating out", "monthly": 168.0, "discretionary": True},
            {"categoryId": "coffee", "label": "Coffee & snacks", "monthly": 72.0, "discretionary": True},
            {"categoryId": "subs", "label": "Subscriptions", "monthly": 46.0, "discretionary": True},
            {"categoryId": "shopping", "label": "Shopping", "monthly": 100.0, "discretionary": True},
        ],
    },
    "savings": {"monthlyAverage": 152.0, "currentSaved": 640.0},
    "goals": [{
        "goalId": "g_deposit", "label": "Deposit fund", "emoji": "\U0001F511",
        "targetAmount": 3000.0, "saved": 640.0, "idealTimeframeMonths": 12, "createdAt": "2026-05-02T00:00:00Z",
    }],
    "points": {"balance": 140, "lifetime": 340, "lastGoalRewardAt": "2026-07-14"},
}

JAYDEN = {
    "userId": "u_jayden", "displayName": "Jayden", "age": 18, "ageBand": "18-25",
    "persona": "secondary_school", "bankId": "demo-bank",
    "accounts": [{"accountId": "acc_jayden_current", "type": "current", "balance": 86.4, "currency": "GBP"}],
    "income": {"monthlyNet": 120.0, "paydayDayOfMonth": 1, "confidence": "medium", "sources": ["part_time", "allowance"]},
    "spending": {
        "monthlyTotal": 74.0,
        "categories": [
            {"categoryId": "transport", "label": "Bus & travel", "monthly": 22.0, "discretionary": False},
            {"categoryId": "lunch", "label": "Lunch & snacks", "monthly": 28.0, "discretionary": True},
            {"categoryId": "gaming", "label": "Games & in-app", "monthly": 14.0, "discretionary": True},
            {"categoryId": "subs", "label": "Subscriptions", "monthly": 10.0, "discretionary": True},
        ],
    },
    "savings": {"monthlyAverage": 46.0, "currentSaved": 62.0},
    "goals": [{
        "goalId": "g_boots", "label": "Match boots", "emoji": "⚽",
        "targetAmount": 220.0, "saved": 62.0, "idealTimeframeMonths": 3, "createdAt": "2026-07-18T00:00:00Z",
    }],
    "points": {"balance": 60, "lifetime": 60, "lastGoalRewardAt": None},
}

HABIT_LIBRARY = [
    {"habitId": "h_coffee", "label": "Skip 3 coffees this week", "categoryId": "coffee", "weeklySaving": 10.5, "points": 10, "personas": ["young_professional"]},
    {"habitId": "h_lunch", "label": "Pack lunch 2 days", "categoryId": "eating_out", "weeklySaving": 14.0, "points": 15, "personas": ["young_professional"]},
    {"habitId": "h_subs", "label": "Cancel one unused subscription", "categoryId": "subs", "weeklySaving": 2.75, "points": 20, "personas": ["young_professional", "secondary_school", "university_student", "gig_worker"]},
    {"habitId": "h_walk", "label": "Walk 2 journeys instead of tap in", "categoryId": "transport", "weeklySaving": 5.6, "points": 10, "personas": ["young_professional", "secondary_school"]},
    {"habitId": "h_snacks", "label": "Snack budget: 3 days at school", "categoryId": "lunch", "weeklySaving": 4.5, "points": 10, "personas": ["secondary_school"]},
    {"habitId": "h_gaming", "label": "No in-game top-ups this week", "categoryId": "gaming", "weeklySaving": 3.25, "points": 15, "personas": ["secondary_school"]},
    {"habitId": "h_takeaway", "label": "Skip 2 takeaways this week", "categoryId": "takeaways", "weeklySaving": 9.0, "points": 15, "personas": ["university_student", "gig_worker"]},
    {"habitId": "h_nightsout", "label": "One fewer night out this month", "categoryId": "nights_out", "weeklySaving": 6.5, "points": 15, "personas": ["university_student"]},
    {"habitId": "h_shopping", "label": "Pause one non-essential purchase this week", "categoryId": "shopping", "weeklySaving": 5.0, "points": 10, "personas": ["young_professional", "university_student", "gig_worker"]},
    {"habitId": "h_fuel", "label": "Plan routes to save a tank of fuel a month", "categoryId": "fuel_transport", "weeklySaving": 8.0, "points": 15, "personas": ["gig_worker"]},
]

REWARD_RULES = {
    "goalCompletionPoints": 100,
    "goalRewardCapPerMonth": 1,
    "pointsToRewardTiers": [
        {"points": 250, "reward": "£5 credit", "amountGBP": 5.0, "fundedBy": "partner_education_budget"},
        {"points": 600, "reward": "£15 credit", "amountGBP": 15.0, "fundedBy": "partner_education_budget"},
        {"points": 1200, "reward": "£40 credit", "amountGBP": 40.0, "fundedBy": "partner_education_budget"},
    ],
}


def main():
    names = NAMES[:]
    random.shuffle(names)
    archetype_cycle = ["young_professional", "secondary_school", "university_student", "gig_worker"]
    bank_ids = [b["bankId"] for b in BANKS]

    profiles = [MAYA, JAYDEN]
    used_ids = {"u_maya", "u_jayden"}
    count = 0
    for name in names:
        if count >= 48:
            break
        persona = archetype_cycle[count % len(archetype_cycle)]
        bank_id = bank_ids[count % len(bank_ids)]
        slug = name.lower()
        user_id = f"u_{slug}"
        if user_id in used_ids:
            user_id = f"u_{slug}{count}"
        used_ids.add(user_id)
        profiles.append(gen_profile(user_id, name, persona, bank_id))
        count += 1

    payload = {
        "schemaVersion": "1.0",
        "_note": (
            "Universal API payload. This is the ONE shape every partner bank routes to Able "
            "AI. 50 demo profiles across 5 fictional partner banks and 4 persona archetypes "
            "(young_professional, secondary_school, university_student, gig_worker) — "
            "generated by scripts/generate_demo_data.py with a fixed seed, so it is "
            "reproducible, not random each run. Maya and Jayden are hand-tuned and kept fixed "
            "because the test suite and demo script reference their exact figures. Owner of "
            "the contract: Product & Design (Anton). Owner of the engine that consumes it: "
            "Builder (Priya)."
        ),
        "banks": BANKS,
        "profiles": profiles,
        "habitLibrary": HABIT_LIBRARY,
        "rewardRules": REWARD_RULES,
    }

    OUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(profiles)} profiles across {len(BANKS)} banks to {OUT_FILE}")


if __name__ == "__main__":
    main()
