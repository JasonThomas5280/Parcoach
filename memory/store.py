"""Family memory with swappable persistence.

Two things persist between calls:

* `family_profile` — one row per family: a JSON blob of durable facts (kids' names, ages,
  temperaments, shared values, "what works for us").
* `sessions` — one row per call: transcript + the Opus-generated summary + extracted facts.

**Local dev** uses SQLite (`PARCOACH_DB`). **Production** uses managed Postgres — set
`DATABASE_URL` and the same `load_context()` / `save_session()` API writes there instead
(containers are ephemeral, so durable memory must live off-box).

v1 keys everything to a single family (`FAMILY_ID`). Multi-household = key by caller later.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from dataclasses import dataclass

_MAX_SUMMARIES = 5  # recent call summaries to load into the next call


@dataclass
class FamilyContext:
    facts: dict
    recent_summaries: list[str]

    def to_prompt_text(self) -> str | None:
        """Render memory for the volatile prompt block, or None if empty."""
        parts: list[str] = []
        if self.facts:
            parts.append("Durable facts:\n" + json.dumps(self.facts, indent=2))
        if self.recent_summaries:
            joined = "\n".join(f"- {s}" for s in self.recent_summaries)
            parts.append("Recent calls (most recent first):\n" + joined)
        return "\n\n".join(parts) if parts else None


def _merge_facts(existing: list[str], new_facts: list[str]) -> list[str]:
    """Append-merge, case-insensitively de-duped, order preserved."""
    seen = {f.lower().strip() for f in existing}
    merged = list(existing)
    for f in new_facts:
        key = f.lower().strip()
        if f and key not in seen:
            merged.append(f)
            seen.add(key)
    return merged


# --------------------------------------------------------------------------- SQLite backend


class _SQLiteBackend:
    def __init__(self, path: str) -> None:
        self.path = path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def init(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS family_profile (
                    family_id TEXT PRIMARY KEY,
                    facts_json TEXT NOT NULL DEFAULT '{}',
                    updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    family_id TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    transcript TEXT,
                    summary TEXT,
                    facts_json TEXT NOT NULL DEFAULT '[]'
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_family
                    ON sessions(family_id, created_at DESC);
                """
            )

    def load_context(self, family_id: str) -> FamilyContext:
        self.init()
        with self._connect() as conn:
            prow = conn.execute(
                "SELECT facts_json FROM family_profile WHERE family_id = ?", (family_id,)
            ).fetchone()
            facts = json.loads(prow["facts_json"]) if prow else {}
            srows = conn.execute(
                "SELECT summary FROM sessions WHERE family_id = ? AND summary IS NOT NULL "
                "ORDER BY created_at DESC LIMIT ?",
                (family_id, _MAX_SUMMARIES),
            ).fetchall()
            summaries = [r["summary"] for r in srows]
        return FamilyContext(facts=facts, recent_summaries=summaries)

    def save_session(
        self, family_id: str, transcript: str, summary: str, durable_facts: list[str]
    ) -> None:
        self.init()
        now = time.time()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO sessions (family_id, created_at, transcript, summary, facts_json)"
                " VALUES (?, ?, ?, ?, ?)",
                (family_id, now, transcript, summary, json.dumps(durable_facts)),
            )
            row = conn.execute(
                "SELECT facts_json FROM family_profile WHERE family_id = ?", (family_id,)
            ).fetchone()
            facts = json.loads(row["facts_json"]) if row else {}
            facts["facts"] = _merge_facts(facts.get("facts", []), durable_facts)
            conn.execute(
                "INSERT INTO family_profile (family_id, facts_json, updated_at) "
                "VALUES (?, ?, ?) ON CONFLICT(family_id) DO UPDATE SET "
                "facts_json = excluded.facts_json, updated_at = excluded.updated_at",
                (family_id, json.dumps(facts), now),
            )
            conn.commit()


# ------------------------------------------------------------------------- Postgres backend


class _PostgresBackend:
    """Mirrors the SQLite backend against managed Postgres (psycopg 3).

    Connect-per-call is fine at household volume; swap in a pool if traffic grows.
    """

    def __init__(self, dsn: str) -> None:
        self.dsn = dsn

    def _connect(self):
        import psycopg
        from psycopg.rows import dict_row

        return psycopg.connect(self.dsn, row_factory=dict_row)

    def init(self) -> None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS family_profile (
                    family_id TEXT PRIMARY KEY,
                    facts_json TEXT NOT NULL DEFAULT '{}',
                    updated_at DOUBLE PRECISION NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    id BIGSERIAL PRIMARY KEY,
                    family_id TEXT NOT NULL,
                    created_at DOUBLE PRECISION NOT NULL,
                    transcript TEXT,
                    summary TEXT,
                    facts_json TEXT NOT NULL DEFAULT '[]'
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_family
                    ON sessions(family_id, created_at DESC);
                """
            )
            conn.commit()

    def load_context(self, family_id: str) -> FamilyContext:
        self.init()
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT facts_json FROM family_profile WHERE family_id = %s", (family_id,)
            )
            prow = cur.fetchone()
            facts = json.loads(prow["facts_json"]) if prow else {}
            cur.execute(
                "SELECT summary FROM sessions WHERE family_id = %s AND summary IS NOT NULL "
                "ORDER BY created_at DESC LIMIT %s",
                (family_id, _MAX_SUMMARIES),
            )
            summaries = [r["summary"] for r in cur.fetchall()]
        return FamilyContext(facts=facts, recent_summaries=summaries)

    def save_session(
        self, family_id: str, transcript: str, summary: str, durable_facts: list[str]
    ) -> None:
        self.init()
        now = time.time()
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (family_id, created_at, transcript, summary, facts_json)"
                " VALUES (%s, %s, %s, %s, %s)",
                (family_id, now, transcript, summary, json.dumps(durable_facts)),
            )
            cur.execute(
                "SELECT facts_json FROM family_profile WHERE family_id = %s", (family_id,)
            )
            row = cur.fetchone()
            facts = json.loads(row["facts_json"]) if row else {}
            facts["facts"] = _merge_facts(facts.get("facts", []), durable_facts)
            cur.execute(
                "INSERT INTO family_profile (family_id, facts_json, updated_at) "
                "VALUES (%s, %s, %s) ON CONFLICT (family_id) DO UPDATE SET "
                "facts_json = EXCLUDED.facts_json, updated_at = EXCLUDED.updated_at",
                (family_id, json.dumps(facts), now),
            )
            conn.commit()


# ------------------------------------------------------------------------------- public API


def _backend():
    """Pick the backend from the environment at call time (test-friendly)."""
    url = os.environ.get("DATABASE_URL")
    if url and url.startswith(("postgres://", "postgresql://")):
        return _PostgresBackend(url)
    return _SQLiteBackend(os.environ.get("PARCOACH_DB", "parcoach.db"))


def _default_family_id() -> str:
    return os.environ.get("FAMILY_ID", "home")


def init_db() -> None:
    _backend().init()


def load_context(family_id: str | None = None) -> FamilyContext:
    return _backend().load_context(family_id or _default_family_id())


def save_session(
    transcript: str,
    summary: str,
    durable_facts: list[str],
    family_id: str | None = None,
) -> None:
    """Persist a finished call and fold its durable facts into the family profile."""
    _backend().save_session(
        family_id or _default_family_id(), transcript, summary, durable_facts
    )
