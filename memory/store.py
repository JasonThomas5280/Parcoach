"""SQLite-backed family memory.

Two things persist between calls:

* `family_profile` — one row per family: a JSON blob of durable facts (kids' names, ages,
  temperaments, shared values, "what works for us").
* `sessions` — one row per call: transcript + the Opus-generated summary + extracted facts.

v1 treats all callers as a single family keyed by `FAMILY_ID`. When we add multiple
households or a companion app, swap SQLite for Postgres/Supabase and key by caller.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from dataclasses import dataclass

_DB_PATH = os.environ.get("PARCOACH_DB", "parcoach.db")
_FAMILY_ID = os.environ.get("FAMILY_ID", "home")
_MAX_SUMMARIES = 5  # how many recent call summaries to load into the next call


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
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


@dataclass
class FamilyContext:
    facts: dict
    recent_summaries: list[str]

    def to_prompt_text(self) -> str | None:
        """Render memory as text for the volatile prompt block, or None if empty."""
        parts: list[str] = []
        if self.facts:
            parts.append("Durable facts:\n" + json.dumps(self.facts, indent=2))
        if self.recent_summaries:
            joined = "\n".join(f"- {s}" for s in self.recent_summaries)
            parts.append("Recent calls (most recent first):\n" + joined)
        return "\n\n".join(parts) if parts else None


def load_context(family_id: str = _FAMILY_ID) -> FamilyContext:
    init_db()
    with _connect() as conn:
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
    transcript: str,
    summary: str,
    durable_facts: list[str],
    family_id: str = _FAMILY_ID,
) -> None:
    """Persist a finished call and fold its durable facts into the family profile."""
    init_db()
    now = time.time()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO sessions (family_id, created_at, transcript, summary, facts_json) "
            "VALUES (?, ?, ?, ?, ?)",
            (family_id, now, transcript, summary, json.dumps(durable_facts)),
        )
        _merge_facts(conn, family_id, durable_facts, now)
        conn.commit()


def _merge_facts(
    conn: sqlite3.Connection, family_id: str, new_facts: list[str], now: float
) -> None:
    """Append-merge new durable facts into the profile under a 'facts' list, de-duped."""
    row = conn.execute(
        "SELECT facts_json FROM family_profile WHERE family_id = ?", (family_id,)
    ).fetchone()
    facts = json.loads(row["facts_json"]) if row else {}
    existing = facts.get("facts", [])
    seen = {f.lower().strip() for f in existing}
    for f in new_facts:
        if f and f.lower().strip() not in seen:
            existing.append(f)
            seen.add(f.lower().strip())
    facts["facts"] = existing

    conn.execute(
        "INSERT INTO family_profile (family_id, facts_json, updated_at) VALUES (?, ?, ?) "
        "ON CONFLICT(family_id) DO UPDATE SET facts_json = excluded.facts_json, "
        "updated_at = excluded.updated_at",
        (family_id, json.dumps(facts), now),
    )
