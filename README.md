# Parcoach

A voice-first **co-parenting coach** you call on the phone. You and your partner talk
through real parenting moments — tantrums, screen-time battles, sibling fights — and a
warm, psychologically-grounded coach talks back and remembers your family.

> Supportive coaching only. **Not** medical, psychological, or legal advice, and not a
> substitute for a pediatrician, therapist, or emergency services.

## How it works

```
Phone (you / your partner)
   │  PSTN
   ▼
Twilio number ──SIP──▶ LiveKit Cloud (media plane, free tier)
                            │ audio
                            ▼
                 LiveKit Agent worker (this repo)
     Deepgram STT ─▶ Claude Sonnet 4.6 ─▶ Cartesia TTS
                            │  + semantic turn-taking + barge-in
                            ▼
                 SQLite memory (family profile + summaries)
                            │
          on hang-up ─▶ Claude Opus 4.8 → summary + durable facts
```

- **Realtime brain:** Claude Sonnet 4.6 (snappy, prompt-cached coaching prompt).
- **After-call brain:** Claude Opus 4.8 writes a summary and extracts durable facts
  (kids' ages, temperaments, what worked) that load into the next call.
- **Knowledge:** a curated, paraphrased knowledge base (`knowledge/coparenting_kb.md`)
  of the core frameworks — small enough to live in the system prompt, no vector DB in v1.

## Project layout

| Path | Purpose |
|------|---------|
| `agent.py` | LiveKit agent entrypoint: STT → LLM → TTS pipeline, turn detection |
| `prompts/system_prompt.py` | Assembles persona + KB + safety (stable) and memory (volatile) |
| `knowledge/coparenting_kb.md` | Distilled parenting frameworks, in our own words |
| `memory/store.py` | SQLite: family profile + per-call summaries |
| `memory/summarize.py` | Opus 4.8 post-call summary + durable-fact extraction |
| `safety/guardrails.py` | Crisis detection + resource responses |

## Setup

1. **Install** (Python 3.11+):
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Keys** — copy `.env.example` to `.env` and fill in:
   - `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (from LiveKit Cloud)
3. **Download turn-detector / VAD model weights** (one time):
   ```bash
   python agent.py download-files
   ```
4. **Run the worker:**
   ```bash
   python agent.py dev
   ```

## Wire up the phone (Twilio → LiveKit)

1. Buy a number in Twilio.
2. In LiveKit Cloud, create an **inbound SIP trunk** and a **dispatch rule** that routes
   inbound calls to this agent.
3. Point the Twilio number's voice config at the LiveKit SIP URI (Twilio Elastic SIP
   Trunking, or a TwiML `<Dial><Sip>` to the LiveKit inbound address).
4. Call the number — the agent answers.

Full step-by-step is in the build plan; LiveKit's "telephony / SIP inbound" docs cover the
exact trunk + dispatch-rule fields.

## Test scenarios

Call the number and try real situations: a toddler tantrum, a screen-time standoff, a
sibling fight. After hanging up, check `parcoach.db` for the saved summary, then call again
and confirm the coach recalls your kids and what worked last time.
