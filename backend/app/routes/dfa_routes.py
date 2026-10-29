from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..models.dfa_models import (
    DFAModel,
    ValidationResult,
    SimulationRequest,
    SimulationResult,
    MinimizationRequest,
    MinimizationResult,
    EquivalenceRequest,
    EquivalenceResult,
)
from ..toc.dfa import DFAValidator
from ..toc.simulator import DFASimulator
from ..toc.equivalence import DFAEquivalenceChecker
from ..toc.minimizer import DFAMinimizer

router = APIRouter(prefix="/api/dfa", tags=["DFA Operations"])

# Standard college TOC tested examples
SAMPLE_EXAMPLES: Dict[str, Dict[str, Any]] = {
    "even_zeros": {
        "id": "even_zeros",
        "name": "Even Number of Zeros",
        "description": "Accepts binary strings containing an even number of 0s over {0,1}.",
        "dfa": {
            "states": ["q_even", "q_odd"],
            "alphabet": ["0", "1"],
            "start_state": "q_even",
            "accept_states": ["q_even"],
            "transitions": {
                "q_even": {"0": "q_odd", "1": "q_even"},
                "q_odd": {"0": "q_even", "1": "q_odd"}
            }
        },
        "test_cases": [
            {"string": "ε", "expected": True},
            {"string": "00", "expected": True},
            {"string": "111", "expected": True},
            {"string": "10101", "expected": True},
            {"string": "0", "expected": False},
            {"string": "0100", "expected": False}
        ]
    },
    "ends_with_01": {
        "id": "ends_with_01",
        "name": "Strings Ending in '01'",
        "description": "Accepts binary strings ending with suffix '01' over {0,1}.",
        "dfa": {
            "states": ["q0", "q1", "q2"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accept_states": ["q2"],
            "transitions": {
                "q0": {"0": "q1", "1": "q0"},
                "q1": {"0": "q1", "1": "q2"},
                "q2": {"0": "q1", "1": "q0"}
            }
        },
        "test_cases": [
            {"string": "01", "expected": True},
            {"string": "0001", "expected": True},
            {"string": "1101", "expected": True},
            {"string": "ε", "expected": False},
            {"string": "0", "expected": False},
            {"string": "010", "expected": False}
        ]
    },
    "contains_101": {
        "id": "contains_101",
        "name": "Strings Containing '101'",
        "description": "Accepts binary strings containing substring '101' over {0,1}.",
        "dfa": {
            "states": ["q0", "q1", "q2", "q3"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accept_states": ["q3"],
            "transitions": {
                "q0": {"0": "q0", "1": "q1"},
                "q1": {"0": "q2", "1": "q1"},
                "q2": {"0": "q0", "1": "q3"},
                "q3": {"0": "q3", "1": "q3"}
            }
        },
        "test_cases": [
            {"string": "101", "expected": True},
            {"string": "001010", "expected": True},
            {"string": "11011", "expected": True},
            {"string": "1001", "expected": False},
            {"string": "000", "expected": False}
        ]
    },
    "faulty_ends_with_01": {
        "id": "faulty_ends_with_01",
        "name": "[Faulty] Strings Ending in '01' (Doctor Sample)",
        "description": "Deliberately faulty student DFA for 'ending in 01' (mistaken transition δ(q1, '1') = q0 instead of q2).",
        "dfa": {
            "states": ["q0", "q1", "q2"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accept_states": ["q2"],
            "transitions": {
                "q0": {"0": "q1", "1": "q0"},
                "q1": {"0": "q1", "1": "q0"},  # Bug here! Should be q2 on '1'
                "q2": {"0": "q1", "1": "q0"}
            }
        },
        "is_faulty": True,
        "target_reference_id": "ends_with_01",
        "test_cases": [
            {"string": "01", "expected": False} # Fails on 01!
        ]
    },
    "unminimized_even_zeros": {
        "id": "unminimized_even_zeros",
        "name": "Redundant/Unminimized DFA (Observatory Sample)",
        "description": "A 4-state DFA recognizing even number of 0s containing equivalent states (q0 ≡ q2 and q1 ≡ q3).",
        "dfa": {
            "states": ["q0", "q1", "q2", "q3", "q_unreachable"],
            "alphabet": ["0", "1"],
            "start_state": "q0",
            "accept_states": ["q0", "q2"],
            "transitions": {
                "q0": {"0": "q1", "1": "q2"},
                "q1": {"0": "q0", "1": "q3"},
                "q2": {"0": "q3", "1": "q0"},
                "q3": {"0": "q2", "1": "q1"},
                "q_unreachable": {"0": "q_unreachable", "1": "q_unreachable"}
            }
        },
        "test_cases": [
            {"string": "ε", "expected": True},
            {"string": "00", "expected": True},
            {"string": "0", "expected": False}
        ]
    }
}

@router.get("/examples")
def get_examples() -> Dict[str, Any]:
    return SAMPLE_EXAMPLES

@router.post("/validate", response_model=ValidationResult)
def validate_dfa(dfa: DFAModel) -> ValidationResult:
    return DFAValidator.validate(dfa)

@router.post("/simulate", response_model=SimulationResult)
def simulate_dfa(req: SimulationRequest) -> SimulationResult:
    try:
        return DFASimulator.simulate(req.dfa, req.input_string)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/equivalence", response_model=EquivalenceResult)
def check_equivalence(req: EquivalenceRequest) -> EquivalenceResult:
    try:
        return DFAEquivalenceChecker.check_equivalence(req.dfa_a, req.dfa_b)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Equivalence calculation error: {str(e)}")

@router.post("/minimize", response_model=MinimizationResult)
def minimize_dfa(req: MinimizationRequest) -> MinimizationResult:
    try:
        return DFAMinimizer.minimize(req.dfa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Minimization algorithm error: {str(e)}")

