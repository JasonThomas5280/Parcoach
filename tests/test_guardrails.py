from safety.guardrails import RESOURCES, crisis_instruction, screen


def test_normal_parenting_talk_not_flagged():
    assert screen("my toddler keeps melting down at dinner") is None
    assert screen("we disagree about screen time limits") is None
    assert screen("how do I get him to share with his sister") is None


def test_empty_input():
    assert screen("") is None
    assert screen(None) is None  # type: ignore[arg-type]


def test_self_harm_flagged():
    hit = screen("honestly I want to die, I can't do this anymore")
    assert hit and hit.category == "self_harm"


def test_domestic_violence_flagged():
    hit = screen("my partner hits me when he's angry")
    assert hit and hit.category == "domestic_violence"


def test_medical_emergency_flagged():
    hit = screen("the baby is not breathing")
    assert hit and hit.category == "medical_emergency"


def test_crisis_instruction_includes_resources():
    hit = screen("I want to die")
    assert hit is not None
    instruction = crisis_instruction(hit)
    assert "SAFETY OVERRIDE" in instruction
    assert RESOURCES in instruction
    assert "988" in instruction
