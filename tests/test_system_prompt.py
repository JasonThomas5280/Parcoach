from prompts.system_prompt import build_instructions, stable_block, volatile_block


def test_stable_block_embeds_kb_and_safety():
    s = stable_block()
    assert "Parcoach" in s
    assert "988" in s  # safety resource
    assert "Connection before correction" in s  # from the KB
    assert "never recite it" in s.lower() or "apply it" in s.lower()


def test_volatile_block_with_memory():
    block = volatile_block("kids: Mateo (4), Ivy (2)")
    assert "WHAT YOU REMEMBER" in block
    assert "Mateo" in block


def test_volatile_block_without_memory():
    block = volatile_block(None)
    assert "don't have any saved history" in block


def test_stable_precedes_volatile():
    full = build_instructions("REMEMBERED_FACT")
    assert full.index("Parcoach") < full.index("REMEMBERED_FACT")
