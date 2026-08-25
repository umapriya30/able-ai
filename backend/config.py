import os


class Settings:
    allowed_origin: str = os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")

    # AI narration is an optional, network-dependent layer (see ai_habits.py).
    # Off by default: the team's own docs are explicit that the demo must
    # "work with the laptop in flight mode" — the deterministic engine above
    # is always what the numbers come from, this only ever adds a narrated
    # paragraph on top of numbers the engine already computed.
    ai_narration_enabled: bool = bool(os.environ.get("ANTHROPIC_API_KEY"))


settings = Settings()
