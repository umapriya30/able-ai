from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import store
from config import settings
from models import Payload
from routers import ai, profiles

app = FastAPI(title="Able AI API", description="Turning little habits into big benefits.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(ai.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/payload", response_model=Payload)
def get_payload() -> Payload:
    """Raw contract payload — useful to verify the build never diverges from
    data/dummy-bank-payload.json, per docs/03-engineering-handoff.md §2."""
    return store.PAYLOAD


@app.post("/demo/seed")
def seed_demo() -> dict[str, int]:
    """Puts the two goals from the design boards on Maya, so the dashboard on
    stage matches the deck. Idempotent, session-only, and reversible with
    /demo/reset."""
    return {"added": store.seed_demo_goals()}


@app.post("/demo/reset")
def reset_demo() -> dict[str, str]:
    store.reset_all()
    return {"status": "reset"}
