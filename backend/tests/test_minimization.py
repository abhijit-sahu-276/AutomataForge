import pytest
from app.models.dfa_models import DFAModel
from app.toc.minimizer import DFAMinimizer
from app.toc.equivalence import DFAEquivalenceChecker

def test_minimization_reduces_redundant_states():
    # 4-state redundant DFA for even zeros
    unmin = DFAModel(
        states=["q0", "q1", "q2", "q3"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q0", "q2"],
        transitions={
            "q0": {"0": "q1", "1": "q2"},
            "q1": {"0": "q0", "1": "q3"},
            "q2": {"0": "q3", "1": "q0"},
            "q3": {"0": "q2", "1": "q1"},
        }
    )
    result = DFAMinimizer.minimize(unmin)
    assert result.original_states_count == 4
    assert result.minimized_states_count == 2
    assert result.is_verified_equivalent is True
    # Verify formally with EquivalenceChecker
    equiv = DFAEquivalenceChecker.check_equivalence(unmin, result.minimized_dfa)
    assert equiv.is_equivalent is True

def test_minimization_prunes_unreachable_states():
    dfa_with_dead = DFAModel(
        states=["q0", "q1", "q_orphan"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"},
            "q_orphan": {"0": "q_orphan", "1": "q_orphan"}
        }
    )
    res = DFAMinimizer.minimize(dfa_with_dead)
    assert "q_orphan" in res.unreachable_states
    assert "q_orphan" not in res.minimized_dfa.states
    assert res.is_verified_equivalent is True

def test_already_minimal_dfa_preserved():
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
    res = DFAMinimizer.minimize(dfa)
    assert res.minimized_states_count == 2
    assert res.is_verified_equivalent is True

