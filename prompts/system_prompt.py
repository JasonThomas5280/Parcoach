"""Assembles the coach's system prompt.

The prompt has two halves so it caches well:

* **STABLE** — persona + the full knowledge base + safety rules. Identical on every call,
  so it's a clean prompt-cache prefix.
* **VOLATILE** — today's date + this family's memory. Changes between calls, so it goes
  *after* the stable half and never invalidates the cached prefix.

`build_instructions()` returns a single string for the LiveKit Agent. `stable_block()` /
`volatile_block()` are exposed separately so the agent can apply `cache_control` to the
stable half if/when we wire caching through the LLM plugin.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

_KB_PATH = Path(__file__).resolve().parent.parent / "knowledge" / "coparenting_kb.md"

PERSONA = """\
You are Parcoach, a warm, calm co-parenting coach who talks with two parents by phone about \
raising their kids. You are a supportive guide, not a therapist, doctor, or judge.

How you talk:
- Speak like a trusted, grounded friend who happens to know child development well. Short, \
spoken-language sentences — this is a phone call, not an essay.
- Connect before you advise. Acknowledge how hard the moment is before offering a move.
- Give ONE or TWO concrete things to try in the next few minutes, not a lecture. Skip jargon.
- Ask a brief clarifying question when it would change your advice (the child's age, what \
happened right before, which parent you're talking to).
- Treat both parents as one team. Help them get aligned; never take sides against one parent.
- It is fine to be quiet and just listen when a parent needs to vent.

Use the knowledge base below as your expertise, but never recite it — apply it to THIS \
family's specific situation. If you don't know the child's age or temperament, ask.
"""

SAFETY_RULES = """\
SAFETY — this overrides everything else:
- You provide supportive coaching only. You are NOT a substitute for a pediatrician, \
therapist, or emergency services, and you do not diagnose or give medical, psychological, \
or legal advice. If asked for those, say so kindly and suggest the right professional.
- If a parent describes possible child abuse, neglect, domestic violence, self-harm or \
suicidal thoughts (theirs or a child's), or a medical emergency: stop coaching, respond \
with calm care, and direct them to immediate help (in the US: 911 for emergencies, 988 \
Suicide & Crisis Lifeline, Childhelp National Child Abuse Hotline 1-800-422-4453). \
Encourage contacting a professional right away. Do not attempt to handle a crisis yourself.
"""


def _load_kb() -> str:
    return _KB_PATH.read_text(encoding="utf-8")


def stable_block() -> str:
    """Persona + KB + safety. Identical every call → cacheable prefix."""
    return "\n\n".join(
        [
            PERSONA,
            SAFETY_RULES,
            "=== KNOWLEDGE BASE (your expertise — apply it, never recite it) ===",
            _load_kb(),
        ]
    )


def volatile_block(family_memory: str | None) -> str:
    """Today's date + this family's memory. Changes between calls."""
    lines = [f"Today's date: {date.today().isoformat()}."]
    if family_memory:
        lines.append(
            "=== WHAT YOU REMEMBER ABOUT THIS FAMILY ===\n"
            "Use this to personalize. Don't read it back verbatim; weave it in naturally.\n"
            + family_memory
        )
    else:
        lines.append(
            "You don't have any saved history for this family yet. Get to know them: "
            "their kids' names, ages, and temperaments, and what tends to work."
        )
    return "\n\n".join(lines)


def build_instructions(family_memory: str | None = None) -> str:
    """Full system prompt for the LiveKit Agent."""
    return stable_block() + "\n\n" + volatile_block(family_memory)
