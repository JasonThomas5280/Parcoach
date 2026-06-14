import memory.store as store


def _use_temp_db(tmp_path, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("PARCOACH_DB", str(tmp_path / "parcoach_test.db"))


def test_round_trip(tmp_path, monkeypatch):
    _use_temp_db(tmp_path, monkeypatch)
    store.save_session(
        transcript="Parent: he won't sleep\nCoach: try a 2-minute warning",
        summary="Bedtime is hard for their 4yo; warnings help.",
        durable_facts=["Child Mateo is 4", "2-minute warning before transitions works"],
        family_id="fam1",
    )
    ctx = store.load_context("fam1")
    assert ctx.recent_summaries == ["Bedtime is hard for their 4yo; warnings help."]
    assert "Child Mateo is 4" in ctx.facts["facts"]
    assert ctx.to_prompt_text() is not None


def test_fact_merge_dedupes(tmp_path, monkeypatch):
    _use_temp_db(tmp_path, monkeypatch)
    store.save_session("t1", "s1", ["Child Mateo is 4"], family_id="fam2")
    store.save_session("t2", "s2", ["child mateo is 4", "Ivy is 2"], family_id="fam2")
    facts = store.load_context("fam2").facts["facts"]
    # case-insensitive dedupe: "Mateo is 4" appears once, "Ivy is 2" added
    assert sum("mateo is 4" in f.lower() for f in facts) == 1
    assert any("Ivy is 2" == f for f in facts)


def test_recent_summaries_capped_and_ordered(tmp_path, monkeypatch):
    _use_temp_db(tmp_path, monkeypatch)
    for i in range(7):
        store.save_session(f"t{i}", f"summary {i}", [], family_id="fam3")
    summaries = store.load_context("fam3").recent_summaries
    assert len(summaries) == store._MAX_SUMMARIES
    assert summaries[0] == "summary 6"  # most recent first


def test_empty_context(tmp_path, monkeypatch):
    _use_temp_db(tmp_path, monkeypatch)
    ctx = store.load_context("nobody")
    assert ctx.facts == {} and ctx.recent_summaries == []
    assert ctx.to_prompt_text() is None
