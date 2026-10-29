import pytest
from app.models.dfa_models import DFAModel
from app.toc.simulator import DFASimulator

# DFA that accepts strings with even number of 0s
even_zeros_dfa = DFAModel(
    states=["q_even", "q_odd"],
    alphabet=["0", "1"],
    start_state="q_even",
    accept_states=["q_even"],
    transitions={
        "q_even": {"0": "q_odd", "1": "q_even"},
        "q_odd": {"0": "q_even", "1": "q_odd"}
    }
)

def test_empty_string_accepted():
    res = DFASimulator.simulate(even_zeros_dfa, "")
    assert res.accepted is True
    assert res.is_empty_string is True
    assert res.final_state == "q_even"
    assert res.path == ["q_even"]
    assert len(res.steps) == 0

def test_empty_string_epsilon_symbol():
    res = DFASimulator.simulate(even_zeros_dfa, "ε")
    assert res.accepted is True
    assert res.is_empty_string is True
    assert res.final_state == "q_even"

def test_single_zero_rejected():
    res = DFASimulator.simulate(even_zeros_dfa, "0")
    assert res.accepted is False
    assert res.final_state == "q_odd"
    assert res.path == ["q_even", "q_odd"]
    assert len(res.steps) == 1
    assert res.steps[0].symbol == "0"
    assert res.steps[0].from_state == "q_even"
    assert res.steps[0].to_state == "q_odd"

def test_multiple_zeros_simulation():
    res = DFASimulator.simulate(even_zeros_dfa, "010")
    assert res.accepted is True
    assert res.final_state == "q_even"
    assert res.path == ["q_even", "q_odd", "q_odd", "q_even"]

def test_invalid_symbol_raises_error():
    with pytest.raises(ValueError, match="not in the DFA alphabet"):
        DFASimulator.simulate(even_zeros_dfa, "012")

