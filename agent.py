"""Parcoach — LiveKit voice agent entrypoint.

Pipeline per call:
    Deepgram STT  →  Claude Sonnet 4.6 (LLM)  →  Cartesia TTS
with Silero VAD + LiveKit's semantic turn detector for natural, no-interrupt turn-taking.

At call start we load this family's memory into the system prompt. When the call ends, we
hand the transcript to Claude Opus 4.8 to write a summary and extract durable facts for next
time.

Run:
    python agent.py download-files   # one-time: fetch VAD / turn-detector weights
    python agent.py dev              # run the worker against LiveKit Cloud

Note: a few LiveKit Agents method signatures (history access, the user-turn hook) move between
minor versions — the spots that depend on them are marked TODO so you can confirm against the
version you install. The structure is the stable part.
"""

from __future__ import annotations

import logging

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, RoomInputOptions
from livekit.plugins import anthropic, cartesia, deepgram, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from config import get_settings
from memory.store import load_context, save_session
from memory.summarize import summarize_call
from prompts.system_prompt import build_instructions
from safety.guardrails import crisis_instruction, screen

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parcoach")


class CoachAgent(Agent):
    """The coach. Instructions carry the persona + KB + safety + this family's memory."""

    def __init__(self, instructions: str) -> None:
        super().__init__(instructions=instructions)

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        """Backstop safety screen: if a turn signals a crisis, steer the model to respond
        with care + resources before it generates its reply. The system-prompt rules are the
        primary guardrail; this guarantees a resource response even if the model misses it.

        TODO(version): confirm hook name/signature and `turn_ctx.add_message` against the
        installed livekit-agents version.
        """
        text = getattr(new_message, "text_content", "") or ""
        hit = screen(text)
        if hit:
            logger.warning("safety screen hit: %s", hit.category)
            turn_ctx.add_message(role="system", content=crisis_instruction(hit))


def _render_transcript(history) -> str:
    """Flatten the session history into a plain transcript for summarization.

    TODO(version): `history.items` / item fields vary by version. Adjust the field names if
    your installed livekit-agents exposes the transcript differently (e.g. `to_dict()`).
    """
    items = getattr(history, "items", None) or []
    lines: list[str] = []
    for item in items:
        role = getattr(item, "role", None)
        if role not in ("user", "assistant"):
            continue
        text = getattr(item, "text_content", None) or ""
        if not text:
            continue
        speaker = "Parent" if role == "user" else "Coach"
        lines.append(f"{speaker}: {text}")
    return "\n".join(lines)


def prewarm(proc: agents.JobProcess) -> None:
    """Load the VAD once per worker process so calls start fast."""
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext) -> None:
    # Fail fast if any required secret is missing before we answer a call.
    settings = get_settings()

    await ctx.connect()

    family = load_context()
    instructions = build_instructions(family.to_prompt_text())

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=anthropic.LLM(model=settings.realtime_model),
        tts=cartesia.TTS(),
        vad=ctx.proc.userdata.get("vad") or silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    async def on_shutdown() -> None:
        transcript = _render_transcript(session.history)
        try:
            result = await summarize_call(transcript)
            save_session(transcript, result.summary, result.durable_facts)
            logger.info(
                "saved call summary (%d durable facts)", len(result.durable_facts)
            )
        except Exception:  # never let summarization crash teardown
            logger.exception("post-call summarization/save failed")

    ctx.add_shutdown_callback(on_shutdown)

    await session.start(
        room=ctx.room,
        agent=CoachAgent(instructions),
        room_input_options=RoomInputOptions(),
    )

    # Open the call warmly.
    await session.generate_reply(
        instructions=(
            "Greet the parents warmly in one or two sentences, say you're Parcoach, and ask "
            "what's going on today. If you remember things about their family, let that warmth "
            "show without reading facts back like a list."
        )
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm)
    )
