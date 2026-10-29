import pytest
from app.models.dfa_models import DFAModel
from app.services.ai_service import AIService
from app.toc.pattern_compiler import PatternCompiler
from app.toc.equivalence import DFAEquivalenceChecker
from app.toc.simulator import DFASimulator

def test_pattern_compiler_ends_with():
    dfa = PatternCompiler.build_ends_with("01", ["0", "1"])
    assert dfa.start_state in dfa.states
    assert len(dfa.accept_states) == 1
    assert DFASimulator.simulate(dfa, "01").accepted is True
    assert DFASimulator.simulate(dfa, "101").accepted is True
    assert DFASimulator.simulate(dfa, "00").accepted is False

def test_pattern_compiler_even_zeros_and_ends_with_one():
    spec = {
        "pattern_type": "even_zeros_and_ends_with_one",
        "alphabet": ["0", "1"],
        "parameters": {"symbol": "0", "suffix": "1"}
    }
    dfa, msg = PatternCompiler.compile_from_spec(spec)
    assert dfa is not None
    assert DFASimulator.simulate(dfa, "001").accepted is True
    assert DFASimulator.simulate(dfa, "01").accepted is False
    assert DFASimulator.simulate(dfa, "00").accepted is False

def test_interpret_language_fallback():
    ai = AIService()
    ai.api_key = None
    res = ai.interpret_language("Construct a DFA over {0,1} that accepts strings ending with 01")
    assert res.specification.is_supported is True
    assert res.dfa is not None
    assert "01" in res.sample_accepted

def test_doctor_repairs_faulty_dfa():
    ai = AIService()
    ai.api_key = None
    ref = DFAModel(
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
    faulty = DFAModel(
        states=["q0", "q1", "q2"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q1", "1": "q0"},  # Bug here!
            "q2": {"0": "q1", "1": "q0"}
        }
    )
    repairs = ai.suggest_repairs(
        ref_dfa=ref,
        stu_dfa=faulty,
        counterexample="01",
        expected_acc=True,
        stu_acc=False,
        ref_path=["q0", "q1", "q2"],
        stu_path=["q0", "q1", "q0"]
    )
    assert len(repairs.candidate_repairs) > 0
    verified = [c for c in repairs.candidate_repairs if c.is_verified_equivalent]
    assert len(verified) >= 1
    best_fix = verified[0]
    assert best_fix.patched_dfa is not None
    equiv = DFAEquivalenceChecker.check_equivalence(ref, best_fix.patched_dfa)
    assert equiv.is_equivalent is True

def test_counterexample_explainer():
    ai = AIService()
    ai.api_key = None
    ref = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    buggy = DFAModel(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accept_states=["q0"], # Inverted
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        }
    )
    exp = ai.explain_counterexample(
        dfa_a=ref,
        dfa_b=buggy,
        counterexample="ε",
        dfa_a_accepted=False,
        dfa_b_accepted=True,
        dfa_a_path=["q0"],
        dfa_b_path=["q0"]
    )
    assert "disproves equivalence" in exp.explanation
    assert "BFS" in exp.why_shortest
