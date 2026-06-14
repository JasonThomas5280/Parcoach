import asyncio
import types

import memory.summarize as sm
from memory.summarize import CallSummary


def test_summarize_parses_structured_output(monkeypatch):
    expected = CallSummary(summary="Talked bedtime.", durable_facts=["Mateo is 4"])

    class FakeMessages:
        async def parse(self, **kwargs):
            # Assert we ask the right model + structured format.
            assert kwargs["model"] == "claude-opus-4-8"
            assert kwargs["output_format"] is CallSummary
            return types.SimpleNamespace(parsed_output=expected)

    class FakeClient:
        def __init__(self, *a, **k):
            self.messages = FakeMessages()

    monkeypatch.setattr(sm.anthropic, "AsyncAnthropic", FakeClient)

    out = asyncio.run(sm.summarize_call("Parent: bedtime is hard\nCoach: try warnings"))
    assert out.summary == "Talked bedtime."
    assert out.durable_facts == ["Mateo is 4"]


def test_summarize_empty_transcript_skips_api(monkeypatch):
    def _boom(*a, **k):
        raise AssertionError("API should not be called for an empty transcript")

    monkeypatch.setattr(sm.anthropic, "AsyncAnthropic", _boom)
    out = asyncio.run(sm.summarize_call("   "))
    assert "no conversation" in out.summary.lower()
    assert out.durable_facts == []
