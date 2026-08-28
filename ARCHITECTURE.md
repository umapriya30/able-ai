# Able AI — Technology, Architecture & Structure

This document covers the **real application** (`backend/` + `frontend/`) on the
`updated_ableaibranch` branch — not the static `prototype/index.html` deliverable,
which is a separate, offline, single-file design artifact described in the
`docs/0X-*.md` series.

---

## 1. Overview

Able AI is a savings-habit coaching app: a user connects a (mock) bank account,
sets a savings goal, and the app shows how many weeks away they are and which
habits would close the gap fastest — with an optional AI layer (Groq) that
explains the plan in plain English and lets the user refine it by chat.

The system is a classic **thin client / stateful API** split:

```
┌─────────────────────────┐        HTTP/JSON        ┌──────────────────────────┐
│   frontend (Next.js)    │ ───────────────────────▶ │   backend (FastAPI)      │
│   React 19, TypeScript  │ ◀─────────────────────── │   Python 3.11+           │
│   port 3000             │                          │   port 8000              │
└─────────────────────────┘                          └───────────┬──────────────┘
                                                                  │
                                                    ┌─────────────┼──────────────┐
                                                    ▼             ▼              ▼
                                          in-memory session   deterministic   Groq API
                                          state (store.py)    engine          (optional,
                                          layered over the    (logic.py,      LLM narration
                                          JSON payload        ai_habits.py)   + chat)
                                                    │
                                                    ▼
                                    data/dummy-bank-payload.json
                                    (single source of truth for every number)
```

Key design decision carried over from the product spec: **the numbers are
never invented**. Every figure the UI shows — timelines, habit savings, AI
narration — is derived from `data/dummy-bank-payload.json` through pure,
testable functions. The LLM is only ever allowed to *narrate* or *select
from* numbers the deterministic engine already computed; it cannot introduce
a new figure. This is enforced by how the code is structured, not by a
disclaimer (see §5).

---

## 2. Technology stack

| Layer | Technology | Version (pinned) | Why |
|---|---|---|---|
| Backend framework | **FastAPI** | `>=0.115` | Async-capable, typed, auto-generates OpenAPI docs, pairs naturally with Pydantic |
| Backend language | **Python** | 3.11+ | |
| Data validation | **Pydantic v2** | `>=2.13` | Every request/response body and the entire data contract is a typed model (`models.py`) |
| ASGI server | **Uvicorn** (`[standard]`) | `>=0.32` | Dev server with `--reload`; ships `python-dotenv` and `watchfiles` as extras |
| Backend tests | **pytest** + **httpx** | `>=8.3` / `>=0.28` | `httpx` drives FastAPI's `TestClient` |
| AI provider | **Groq** (`groq` Python SDK) | `>=0.11` | Fast inference; model used: `openai/gpt-oss-20b` |
| Frontend framework | **Next.js** (App Router) | `16.3.2` | Turbopack dev/build, file-based routing (though the app itself is a single client-rendered page — see §4) |
| UI library | **React** | `19.2.8` | |
| Language | **TypeScript** | `^5` | Strict mode; frontend types in `lib/types.ts` hand-mirror `backend/models.py` field-for-field |
| Styling | Plain CSS (`app/globals.css`) with **CSS custom properties** as a design-token system | — | No CSS framework/library — a closed, hand-rolled component/token system (see `CLAUDE.md`) |
| Linting | **ESLint 9** + `eslint-config-next` | `^9` | |
| Package manager | **npm** | — | `package-lock.json` committed |
| Data store | **A single JSON file** (`data/dummy-bank-payload.json`) + **in-process Python dicts** for session state | — | No database. See §3.2 |
| Local dev orchestration | `run-app.bat` | — | One-click launcher: starts uvicorn + `npm run dev`, opens the browser |

No database, no ORM, no auth provider, no message queue — this is a hackathon
demo built to run entirely offline/local except for the optional Groq calls.

---

## 3. Backend architecture (`backend/`)

### 3.1 Module map

```
backend/
├── main.py                  FastAPI app: CORS setup, router mounting, /health, /payload, /demo/*
├── config.py                Settings — reads env vars (ALLOWED_ORIGIN, GROQ_API_KEY, points config)
├── models.py                Every Pydantic model: the data contract + all request/response shapes
├── store.py                 In-memory session state layered over the immutable JSON payload
├── logic.py                 Pure functions: timeline math, spend/save split, habit explanations
├── ai_habits.py             AI layer: habit ranking, Groq narration, Groq chat
├── persona_generator.py     Builds a new profile at signup/login-with-unknown-name
├── routers/
│   ├── profiles.py          Profile, goal, habit, reward endpoints (17 routes)
│   └── ai.py                AI recommendation + narration + chat endpoints (4 routes)
├── scripts/generate_demo_data.py   One-off script that generated the 50 seed profiles
├── tests/test_logic.py      Unit tests for the deterministic engine (14 tests)
└── data/ (repo root)        dummy-bank-payload.json — the actual data
```

### 3.2 Data & state model — no database

There is **no database**. Two layers instead:

1. **The payload** (`data/dummy-bank-payload.json`) — loaded once at startup
   into `store.PAYLOAD` (a `Payload` Pydantic model). Contains: 51 mock user
   profiles (accounts, spending categories, savings, goals, points), 3 mock
   banks, a 13-entry curated habit library, and the points/reward-tier rules.
   This file is the **single source of truth for every number** the app
   shows — nothing is hardcoded elsewhere.

2. **Session state** (`store.py` module-level dicts) — everything a user can
   change at runtime, kept *separate* from the payload so the payload itself
   stays immutable and re-runnable:

   | Dict | Keyed by | Holds |
   |---|---|---|
   | `TICKED_HABITS` | `profileId` | set of ticked habit IDs |
   | `POINTS` | `profileId` | mutable copy of the profile's points balance |
   | `GOAL_OVERRIDES` | `goalId` | edited label/target/timeframe (payload value used until overridden) |
   | `GOAL_SAVED_OVERRIDES` | `goalId` | set when a goal is marked complete |
   | `CUSTOM_HABITS` | `profileId` | user-typed-in habits |
   | `GENERATED_PROFILES` | `userId` | profiles created via "login with an unrecognized name" |

   `POST /demo/reset` (and the frontend's "Reset demo" control) calls
   `store.reset_all()`, which reloads the JSON file and clears every dict —
   i.e. **all state is in-process memory and resets on backend restart**, by
   design (rehearsal-friendly, no persistence layer to manage). The one
   exception: `POST /signup` *does* write the new profile back into
   `data/dummy-bank-payload.json` on disk, so a signed-up account survives a
   restart.

### 3.3 The deterministic engine (`logic.py`)

Pure, side-effect-free functions — the actual "how many weeks away are you"
math, independent of any framework or AI:

- `compute_timeline()` — `weeks = ceil(max(0, target - saved) / weekly)`,
  where `weekly = baselineWeekly + tickedHabitWeekly + lever`. Handles the
  zero-leftover edge case (never renders "∞") and the "behind schedule"
  edge case (shows the honest number *and* what it'd take to hit the
  original date).
- `explain_habit()` — the "where this money came from" text under each
  habit row, computed from the profile's own category spend.
- `spend_save_split()`, `compute_savings_history()`,
  `months_from_target_date()`, `award_goal_completion()` — dashboard/reward
  support math.

`WEEKS_PER_MONTH = 4.345` is a pinned contract constant (not `4` or `4.33`)
so this build's numbers never drift from the design prototype's.

### 3.4 The AI layer (`ai_habits.py`)

Three separate concerns, each with a deterministic fallback so nothing
requires a network call to work on stage:

1. **`generate_ai_habits()`** — deterministic, no LLM. Prefers a curated
   `habitLibrary` entry for the profile's persona + category; falls back to
   *generating* a suggestion for any other discretionary category the
   profile spends in (sized as 30% of that category's weekly spend). Ranked
   by weekly £ impact.
2. **`narrate_plan()` → `narrate_plan_groq()` / `narrate_plan_template()`** —
   turns the ranked list into one short, insightful sentence. Uses Groq
   (`openai/gpt-oss-20b`, `reasoning_effort="low"`) when `GROQ_API_KEY` is
   set; falls back to a deterministic string-template narrator otherwise.
   The prompt explicitly grounds the model in each category's *real*
   recurring spend (from `explain_habit()`) and forbids inventing numbers.
3. **`chat_about_habits()` → `_chat_about_habits_groq()`** — the AI Assistant
   chat box. The model can **only pick from the same computed candidate
   pool** `generate_ai_habits()` already produced (up to 10 candidates); it
   replies in a strict `REPLY: ... / HABIT_IDS: ...` two-line format that
   `_parse_chat_reply()` parses, and any habit ID not in the real candidate
   list is dropped. This is the safety mechanism: the model can change
   *which* suggestions are shown, never invent a new habit or a new £
   figure. Falls back to the current top-3 candidates if Groq is
   unavailable or errors.

All three are wrapped in `try/except` so a network/key problem degrades to
the deterministic path instead of breaking the demo.

> **Model quirk worth knowing:** `openai/gpt-oss-20b` on Groq is a
> reasoning model — with a low token budget it can spend the *entire*
> budget on hidden reasoning and return empty visible text
> (`finish_reason="length"`), and it intermittently mis-emits a bogus
> tool-call wrapper when given multi-turn `system` + history messages even
> with no tools defined. Both are worked around: `reasoning_effort="low"`
> plus a generous `max_tokens`, and folding conversation history into a
> single `user` message instead of multi-turn `system`/`assistant` turns.

### 3.5 API surface

Mounted in `main.py`, CORS restricted to `ALLOWED_ORIGIN` (env var).

**`routers/profiles.py`**

| Method | Path | Purpose |
|---|---|---|
| GET | `/profiles` | List all profiles |
| GET | `/profiles/search` | Search profiles |
| POST | `/signup` | Create an account (persisted to disk) |
| POST | `/login` | Log in by name; generates a profile if unrecognized |
| GET | `/profiles/{id}` | Get one profile |
| PATCH | `/profiles/{id}` | Edit display name / notification prefs |
| GET | `/profiles/{id}/spend-summary` | Spend-vs-save split for the dashboard donut |
| POST | `/profiles/{id}/banks/link` | Link another mock bank |
| POST | `/profiles/{id}/goals` | Create a goal |
| PATCH | `/profiles/{id}/goals/{goalId}` | Edit a goal's label/target/timeframe |
| GET | `/profiles/{id}/goals/{goalId}/timeline` | Compute the timeline (accepts `lever`) |
| GET | `/profiles/{id}/goals/{goalId}/savings-history` | Chart data |
| POST | `/profiles/{id}/goals/{goalId}/complete` | Mark reached, award points |
| GET | `/profiles/{id}/habits` | Curated + custom habits, with ticked state |
| POST | `/profiles/{id}/habits/{habitId}/toggle` | Tick/untick (curated, custom, **or AI-generated**) |
| POST | `/profiles/{id}/habits/custom` | Add a free-typed habit |
| POST | `/profiles/{id}/rewards/claim` | Claim a points reward tier |

**`routers/ai.py`**

| Method | Path | Purpose |
|---|---|---|
| GET | `/profiles/{id}/ai-habits/{goalId}` | Ranked AI habit suggestions |
| GET | `/ai/status` | `{narrationAvailable, llmEnhanced}` — whether Groq is configured |
| POST | `/profiles/{id}/ai-habits/{goalId}/narrate` | Groq/template narration paragraph |
| POST | `/profiles/{id}/ai-habits/{goalId}/chat` | AI Assistant chat turn |

**`main.py`** also serves `GET /health`, `GET /payload` (raw contract
payload), `POST /demo/seed`, `POST /demo/reset`.

---

## 4. Frontend architecture (`frontend/`)

### 4.1 It's a single-page app inside Next.js, not a multi-route site

Despite using the Next.js App Router, there is exactly one route
(`app/page.tsx` → `<AppShell />`). **All navigation is client-side React
state**, not URL routing:

```ts
const [screen, setScreen] = useState<ScreenName>("handoff");
```

`AppShell.tsx` (~700 lines) is the single state-owning component: every
piece of app state (current profile, active goal, timeline, habits, AI
suggestions, chat messages, celebration overlay, etc.) lives here in
`useState`, and it renders exactly one of ~15 "screen" components based on
`screen`. This mirrors the original prototype's screen-by-screen design
(`prototype/index.html`) but as real React components hitting a real API
instead of canned data.

### 4.2 Directory map

```
frontend/
├── app/
│   ├── layout.tsx, page.tsx        Next.js App Router entry — renders <AppShell/>
│   ├── globals.css                 Design tokens (CSS custom properties) + all component styles
│   └── components/
│       ├── AppShell.tsx            The state machine — owns all app state, wires API ↔ screens
│       ├── screens/                One component per screen (~15): Welcome, Login, BankLink,
│       │                           Analysing, Home, NewGoal, GoalBreakdown, Timeline,
│       │                           AIRecommend, Habits, Rewards, Settings, Handoff
│       ├── AIChatBox.tsx           The AI Assistant chat widget (used inside AIRecommendScreen)
│       ├── HabitRow.tsx            Shared tickable habit row (curated, custom, and AI suggestions)
│       ├── GoalCard.tsx, TimelineRail.tsx, DonutSplit.tsx, SavingsTrendChart.tsx, ...
│       │                           Shared visual components (design system's "closed inventory")
│       ├── Buttons.tsx, Chip.tsx, Sheet.tsx, TabBar.tsx, PointsCounter.tsx, ...
│       └── CelebrationOverlay.tsx  Goal-completion celebration
├── lib/
│   ├── api.ts                      Every backend call, one object: `api.getProfile(...)`, etc.
│   ├── types.ts                    TypeScript interfaces hand-mirroring backend/models.py
│   ├── screens.ts                  `ScreenName` union + the arrow-key demo run-of-show order
│   ├── derive.ts                   Small pure helpers (totalBalance, savePct, bankCode, ...)
│   ├── icons.tsx                   Hand-computed inline SVG icons (no icon font/library)
│   └── format.ts                   `money()`, `money2()` formatting helpers
├── AGENTS.md                       Note: this Next.js version has API differences from
│                                    typical model training data — check node_modules/next/dist/docs
└── package.json
```

### 4.3 Data flow

```
AppShell (useState)
   │  calls
   ▼
lib/api.ts  ──fetch()──▶  backend (FastAPI)
   │  returns typed JSON (lib/types.ts mirrors backend/models.py)
   ▼
setState(...)  ──▶  re-render the active screen component (props only, no context/redux)
```

There is no global state library (no Redux/Zustand/Context) — plain
`useState`/`useCallback` in `AppShell`, passed down as props. Given the
screen count (~15) this is a large prop surface but keeps the data flow
fully traceable in one file.

### 4.4 Styling — hand-rolled design-token system

No Tailwind/MUI/styled-components. `app/globals.css` defines a closed set of
CSS custom properties (`--ink`, `--card`, `--momentum`, `--slip`, spacing
scale `4 8 12 16 24 32 48`, radii `10/18/28/999px`) and every component
consumes them via `className`. This mirrors the design system used by the
static prototype (`docs/02-design-system.md`), reimplemented as real CSS.

---

## 5. AI recommendation flow, end to end

This is the feature most recently added on this branch, and ties the whole
stack together:

1. User opens a goal → `AppShell.openGoal()` fetches the timeline, then
   navigates to the **`ai-recommend`** screen and calls
   `loadAIRecommendations()`.
2. That hits `GET /ai-habits/{goalId}` (ranked, deterministic candidates) and
   `POST /ai-habits/{goalId}/narrate` (Groq or template) **in parallel**,
   plus `GET /ai/status` to know whether Groq is actually active.
3. `AIRecommendScreen` renders the narration + up to 3 `HabitRow`s, plus the
   `AIChatBox` below them.
4. Typing in the chat box calls `POST /ai-habits/{goalId}/chat` with the
   message and recent history; the response's `suggestions` array **replaces**
   what's shown — the chat can re-rank/filter/swap which of the real
   candidates are displayed, grounded entirely in server-side computed data.
5. Ticking a suggestion (in either the ranked list or a chat-narrowed one)
   calls the *same* `POST /habits/{habitId}/toggle` endpoint the main habit
   Action Center uses — `toggle_habit()` in `routers/profiles.py` falls back
   to regenerating the AI candidate pool server-side to resolve an
   AI-generated `habitId` that isn't in the curated library, so ticking an
   AI suggestion is a first-class action, not a special case.
6. "Go to habit tracking" moves to the `breakdown` screen, which shows the
   full curated+custom Action Center as normal.

---

## 6. Environment & configuration

Backend (`backend/.env`, gitignored — `backend/.env.example` documents the
shape):

| Var | Purpose | Default |
|---|---|---|
| `ALLOWED_ORIGIN` | CORS-allowed frontend origin | `http://localhost:3000` |
| `GROQ_API_KEY` | Enables Groq-powered narration + chat | unset → deterministic fallback only |
| `DEFAULT_ANNUAL_RETURN_RATE` | Reserved for future savings-growth math | `0.0` |
| `HABIT_COMPLETION_POINTS`, `GOAL_BONUS_POINTS` | Points economy tuning | `10`, `100` |

Frontend: `NEXT_PUBLIC_API_URL` — backend base URL, defaults to
`http://localhost:8000` if unset (see `lib/api.ts`).

`--env-file .env` must be passed to `uvicorn` for the backend to actually
load `.env` (there's no `python-dotenv` call in the app code — it's supplied
by `uvicorn[standard]`'s own `--env-file` support).

---

## 7. Testing & tooling

- **Backend**: `pytest` (`backend/tests/test_logic.py`, 14 tests) — unit
  tests for the deterministic engine (`logic.py`), run with
  `.venv/Scripts/python.exe -m pytest -q` from `backend/`.
- **Frontend**: `npx tsc --noEmit` (strict typecheck), `npm run lint`
  (ESLint 9 flat config), `npm run build` (Next.js/Turbopack production
  build — also runs its own TypeScript pass).
- No end-to-end/browser test suite exists yet; manual verification is via
  `run-app.bat` or `npm run dev` + `uvicorn --reload`.

---

## 8. Notable limitations (by design, not oversight)

- **No per-transaction data.** `data/dummy-bank-payload.json` only holds
  *monthly category totals* per profile (`spending.categories[].monthly`),
  not a transaction feed. "AI recommendation based on spending patterns"
  is grounded in these recurring monthly-average-as-weekly-rate figures —
  genuinely real, but not line-item transaction analysis. `docs/01-user-journey.md`
  explicitly scopes a transaction list out of this build.
- **No persistence beyond one JSON file.** Session state (ticked habits,
  points, goal edits) lives in Python process memory and is lost on backend
  restart, except signed-up profiles (written back to the JSON file).
- **No auth.** "Login" is a name lookup against the payload's profile list
  (or generates a new one) — there's no password/session-token layer.
