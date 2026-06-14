"""Validated runtime configuration.

Loads settings from the environment (and `.env` for local dev) and **fails fast** if a
required secret is missing — so a misconfigured production deploy never silently starts a
worker that can't reach Claude, Deepgram, Cartesia, or LiveKit.

Import and call `get_settings()` at worker startup (see `agent.py`). The voice plugins also
read their own env vars (`DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`, `LIVEKIT_*`) directly; this
class is what guarantees they're present before we start taking calls.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # Required secrets — missing any of these raises at startup.
    anthropic_api_key: str
    deepgram_api_key: str
    cartesia_api_key: str
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str

    # Persistence: Postgres in prod (set DATABASE_URL), SQLite locally.
    database_url: str | None = None
    parcoach_db: str = "parcoach.db"

    # App config.
    family_id: str = "home"
    realtime_model: str = "claude-sonnet-4-6"
    summary_model: str = "claude-opus-4-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
