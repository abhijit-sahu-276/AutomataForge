import pytest
from app.models.dfa_models import DFAModel
from app.toc.dfa import DFAValidator

def test_valid_dfa():
    dfa = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is True
    assert len(res.errors) == 0

def test_missing_start_state():
    dfa = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q_nonexistent",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is False
    assert any("Start state" in err for err in res.errors)

def test_invalid_accept_state():
    dfa = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q99"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is False
    assert any("Accept state 'q99'" in err for err in res.errors)

def test_incomplete_transitions():
    dfa = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1"}, # Missing transition on '1'
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is False
    assert any("lacks a transition for symbol '1'" in err for err in res.errors)

def test_invalid_destination():
    dfa = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q_nowhere", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is False
    assert any("points to non-existent state 'q_nowhere'" in err for err in res.errors)

def test_unreachable_states_warning():
    dfa = DFAModel(
        states=["q0", "q1", "q_orphan"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"},
            "q_orphan": {"0": "q0", "1": "q1"}
        }
    )
    res = DFAValidator.validate(dfa)
    assert res.is_valid is True
    assert "q_orphan" in res.unreachable_states
    assert any("Unreachable states detected" in w for w in res.warnings)

