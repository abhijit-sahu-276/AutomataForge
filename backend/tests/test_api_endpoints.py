import pytest
from app.main import health_check
from app.routes.dfa_routes import (
    get_examples,
    validate_dfa,
    simulate_dfa,
    check_equivalence,
    minimize_dfa,
)
from app.routes.ai_routes import interpret_language
from app.models.dfa_models import (
    DFAModel,
    SimulationRequest,
    EquivalenceRequest,
    MinimizationRequest,
    NaturalLanguageRequest,
)

def test_health_endpoint():
    res = health_check()
    assert res.status == "ok"
    assert "AutomataForge" in res.backend
    assert isinstance(res.ai_configured, bool)

def test_examples_endpoint():
    examples = get_examples()
    assert "even_zeros" in examples
    assert "ends_with_01" in examples
    assert "contains_101" in examples
    assert "faulty_ends_with_01" in examples

def test_validate_endpoint():
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
    res = validate_dfa(dfa)
    assert res.is_valid is True

def test_simulate_endpoint():
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
    req = SimulationRequest(dfa=dfa, input_string="0")
    res = simulate_dfa(req)
    assert res.accepted is True
    assert res.final_state == "q1"

def test_equivalence_endpoint():
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
    req = EquivalenceRequest(dfa_a=dfa, dfa_b=dfa)
    res = check_equivalence(req)
    assert res.is_equivalent is True

def test_minimize_endpoint():
    dfa = DFAModel(
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
    req = MinimizationRequest(dfa=dfa)
    res = minimize_dfa(req)
    assert res.minimized_states_count == 2
    assert res.is_verified_equivalent is True

def test_ai_interpret_endpoint():
    req = NaturalLanguageRequest(description="Construct a DFA over {0,1} that accepts strings ending with 01")
    res = interpret_language(req)
    assert res.specification.is_supported is True
    assert res.dfa is not None
