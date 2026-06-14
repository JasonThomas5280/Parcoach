"""Crisis detection for the live conversation.

This is a deliberately conservative v1 heuristic: a keyword/phrase screen that flags
high-risk turns so the agent can switch from coaching to care + resources. It will
over-trigger sometimes — that's the safe direction. The model's system-prompt safety rules
are the primary guardrail; this is a backstop that guarantees a resource response even if the
model misses it.

Upgrade path: replace `screen()` with a small classifier (e.g. a fast Claude Haiku call or a
fine-tuned classifier) for fewer false positives and better recall.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# US resources. Localize before shipping outside the US.
RESOURCES = (
    "If anyone is in immediate danger, call 911. "
    "For thoughts of suicide or self-harm, the 988 Suicide & Crisis Lifeline is available "
    "24/7 — call or text 988. "
    "To report or ask about child abuse, the Childhelp National Child Abuse Hotline is "
    "1-800-422-4453."
)

# category -> patterns. Word-boundary regexes, case-insensitive.
_PATTERNS: dict[str, list[str]] = {
    "self_harm": [
        r"\bkill myself\b",
        r"\bend my life\b",
        r"\bsuicid(e|al)\b",
        r"\bhurt myself\b",
        r"\bdon'?t want to (live|be here)\b",
        r"\bwant to die\b",
    ],
    "child_safety": [
        r"\b(hit|hitting|punch|beat|beating|slap|burn(ed)?|choke)\b.*\b(kid|child|baby|son|daughter|him|her|them)\b",
        r"\b(abuse|abusing|abused|molest|neglect(ed|ing)?)\b",
        r"\bleft (him|her|them|the kids?) alone\b",
        r"\bnot safe at home\b",
    ],
    "domestic_violence": [
        r"\b(he|she|they|my (husband|wife|partner|ex)) (hits?|hit|beats?|threatens?|chokes?) me\b",
        r"\bafraid of (him|her|them|my (husband|wife|partner|ex))\b",
        r"\bdomestic (violence|abuse)\b",
    ],
    "medical_emergency": [
        r"\bnot breathing\b",
        r"\b(unconscious|unresponsive|won'?t wake up)\b",
        r"\b(seizure|overdos(e|ing)|bleeding badly|swallowed)\b",
    ],
}

_COMPILED = {
    cat: [re.compile(p, re.IGNORECASE) for p in pats] for cat, pats in _PATTERNS.items()
}


@dataclass
class SafetyHit:
    category: str
    resource_message: str


def screen(text: str) -> SafetyHit | None:
    """Return a SafetyHit if the turn signals a crisis, else None."""
    if not text:
        return None
    for category, patterns in _COMPILED.items():
        if any(p.search(text) for p in patterns):
            return SafetyHit(category=category, resource_message=RESOURCES)
    return None


def crisis_instruction(hit: SafetyHit) -> str:
    """A system-level steer to inject when a crisis is detected mid-call."""
    return (
        "SAFETY OVERRIDE: The parent may have just described a crisis "
        f"(category: {hit.category}). Stop normal coaching. Respond with calm, brief care, "
        "make sure everyone is safe right now, and clearly share these resources, then "
        "encourage reaching the right professional immediately:\n"
        f"{hit.resource_message}"
    )
