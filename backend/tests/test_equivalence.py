import pytest
from app.models.dfa_models import DFAModel
from app.toc.equivalence import DFAEquivalenceChecker

def test_identical_dfas_equivalent():
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
    res = DFAEquivalenceChecker.check_equivalence(dfa, dfa)
    assert res.is_equivalent is True
    assert res.counterexample is None

def test_structurally_different_equivalent_dfas():
    # DFA 1: 2 states (even zeros)
    dfa1 = DFAModel(
        states=["e", "o"],
        alphabet=["0", "1"],
        start_state="e",
        accept_states=["e"],
        transitions={
            "e": {"0": "o", "1": "e"},
            "o": {"0": "e", "1": "o"}
        }
    )
    # DFA 2: 4 states (equivalent to even zeros, e1 ≡ e2, o1 ≡ o2)
    dfa2 = DFAModel(
        states=["e1", "o1", "e2", "o2"],
        alphabet=["0", "1"],
        start_state="e1",
        accept_states=["e1", "e2"],
        transitions={
            "e1": {"0": "o1", "1": "e2"},
            "o1": {"0": "e2", "1": "o2"},
            "e2": {"0": "o2", "1": "e1"},
            "o2": {"0": "e1", "1": "o1"}
        }
    )
    res = DFAEquivalenceChecker.check_equivalence(dfa1, dfa2)
    assert res.is_equivalent is True
    assert res.counterexample is None

def test_empty_string_distinguishing_counterexample():
    # DFA 1 accepts empty string, DFA 2 rejects it
    dfa1 = DFAModel(
        states=["q0"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q0"],
        transitions={"q0": {"0": "q0", "1": "q0"}}
    )
    dfa2 = DFAModel(
        states=["p0"],
        alphabet=["0", "1"],
        start_state="p0",
        accept_states=[],
        transitions={"p0": {"0": "p0", "1": "p0"}}
    )
    res = DFAEquivalenceChecker.check_equivalence(dfa1, dfa2)
    assert res.is_equivalent is False
    assert res.counterexample == "ε"
    assert res.dfa_a_accepted is True
    assert res.dfa_b_accepted is False

def test_shortest_counterexample_guaranteed_by_bfs():
    # Correct ends in 01
    dfa_correct = DFAModel(
        states=["q0", "q1", "q2"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q1", "1": "q2"},
            "q2": {"0": "q1", "1": "q0"}
        }
    )
    # Buggy version where delta(q1, '1') = q0 instead of q2
    dfa_buggy = DFAModel(
        states=["q0", "q1", "q2"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q1", "1": "q0"},
            "q2": {"0": "q1", "1": "q0"}
        }
    )
    res = DFAEquivalenceChecker.check_equivalence(dfa_correct, dfa_buggy)
    assert res.is_equivalent is False
    assert res.counterexample == "01"
    assert res.dfa_a_accepted is True
    assert res.dfa_b_accepted is False
    assert len(res.product_path) == 3

