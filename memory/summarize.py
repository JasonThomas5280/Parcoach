"""After-call summarization with Claude Opus 4.8.

When a call ends, we hand the transcript to Opus 4.8 and get back a short summary plus a list
of *durable* facts worth remembering next time (kids' ages/temperaments, what worked, ongoing
challenges). Structured output guarantees we can persist it without parsing prose.

Opus (not the realtime Sonnet) is used here because this runs off the latency path — quality
matters more than speed for the memory that compounds across calls.
"""

from __future__ import annotations

import anthropic
from pydantic import BaseModel, Field

_MODEL = "claude-opus-4-8"


class CallSummary(BaseModel):
    summary: str = Field(
        description="2-4 sentence recap of what the parents were dealing with and the "
        "guidance given, written for the coach to read before the next call."
    )
    durable_facts: list[str] = Field(
        default_factory=list,
        description="Short, standalone facts worth remembering long-term: kids' names/ages/"
        "temperaments, family values, and concrete things that worked or didn't. Omit "
        "one-off details. Empty list if nothing durable came up.",
    )


_PROMPT = """\
Below is a transcript of a phone call between two parents and Parcoach, their parenting coach.

Write a brief summary for the coach to read before the next call, and extract any durable \
facts worth remembering long-term. Durable means it will still matter weeks from now (a \
child's age or temperament, a recurring struggle, a strategy that worked) — not one-off \
details of today's incident.

Transcript:
{transcript}
"""


async def summarize_call(transcript: str) -> CallSummary:
    """Summarize a finished call. Returns a CallSummary (empty-ish on failure)."""
    if not transcript or not transcript.strip():
        return CallSummary(summary="(no conversation captured)", durable_facts=[])

    client = anthropic.AsyncAnthropic()
    response = await client.messages.parse(
        model=_MODEL,
        max_tokens=2000,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": _PROMPT.format(transcript=transcript)}],
        output_format=CallSummary,
    )
    return response.parsed_output or CallSummary(
        summary="(summary unavailable)", durable_facts=[]
    )
