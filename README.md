# Able AI — Product & Design

Turning little habits into big benefits.
Deliverables for the Work in Fintech AI Summit hackathon, 28 Aug 2026.

## Start here

```
prototype/index.html          Clickable prototype — open in any browser, works offline
data/dummy-bank-payload.json  The universal API contract. Single source of truth for every number
docs/01-user-journey.md       Personas, journey map, wireframes, states, edge cases
docs/02-design-system.md      Tokens, typography, and the visual-feedback spec
docs/03-engineering-handoff.md  For Priya: contract, maths, class names, acceptance checklist
docs/04-demo-run-of-show.md   For Nikita: 90-second demo, beat by beat, plus the failure plan
docs/05-risks-and-challenges.md  Challenges to the product, raised for the team
backend/                      FastAPI service — serves the payload contract and habit/AI logic
frontend/                     Next.js app — the buildable version of the prototype
```

## Prerequisites

- Python 3.11+ (backend)
- Node.js 18+ and npm (frontend — Next.js 16 requires it)
- Git
- No prerequisites for the prototype itself — any modern browser

## Full local setup (all three pieces, in order)

```bash
git clone https://github.com/umapriya30/able-ai.git
cd able-ai
```

1. **Prototype** — nothing to install, see [Running the prototype](#running-the-prototype)
2. **Backend** — see [Running the backend](#running-the-backend-fastapi), start it first
3. **Frontend** (separate terminal, backend still running) — see [Running the frontend](#running-the-frontend-nextjs)

## Running the prototype

Open `prototype/index.html` in a browser. No build, no server, no network — deliberately, so it cannot fail on stage.

- <kbd>←</kbd> <kbd>→</kbd> move through the run of show
- Persona toggle switches Maya (23) / Jayden (16); every number recalculates
- "Reach the goal" fires the completion reward, including the one-per-month cap
- "Reset demo" clears ticks and points between rehearsals

## Running the backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows — use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env        # Windows — use `cp .env.example .env` on macOS/Linux
uvicorn main:app --reload
```

- Serves on `http://localhost:8000`
- `GET /health` — liveness check
- `GET /payload` — the raw contract payload, kept in sync with `data/dummy-bank-payload.json`
- `POST /demo/reset` — clears ticks and points between rehearsals
- Routers: `routers/profiles.py` (persona/profile data), `routers/ai.py` (habit/AI logic)
- Config (`.env`): `ALLOWED_ORIGIN`, `DEFAULT_ANNUAL_RETURN_RATE`, `HABIT_COMPLETION_POINTS`, `GOAL_BONUS_POINTS`
- Tests: `pytest` from inside `backend/`
- Dependencies (`backend/requirements.txt`):
  - `fastapi` — the API framework
  - `uvicorn[standard]` — ASGI server used to run it
  - `pydantic` — request/response models and validation
  - `python-multipart` — form/file upload parsing
  - `pytest` — test runner
  - `httpx` — test client for the FastAPI app

## Running the frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Serves on `http://localhost:3000`, expects the backend at `ALLOWED_ORIGIN` (default `http://localhost:3000` on the backend side — update `backend/.env` if the ports differ)
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` — ESLint
- Screens live in `app/components/screens/`; shared UI in `app/components/` follows the closed component inventory in `CLAUDE.md`

## Repository history note

This repo was created on GitHub first (private, with its default `.gitignore` + `LICENSE` + `README.md` scaffold), then the local project history was pushed separately and briefly diverged from it. The two histories were reconciled with `git rebase origin/main main`, resolving the scaffold vs. project conflicts in `.gitignore` and `README.md` in favour of the project's real content, then pushed with a normal `git push origin main` (no force-push, no history rewritten on the remote side beyond the rebase itself).
