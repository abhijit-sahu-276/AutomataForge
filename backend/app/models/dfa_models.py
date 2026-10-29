from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field, ConfigDict

class DFAModel(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "states": ["q0", "q1"],
                "alphabet": ["0", "1"],
                "start_state": "q0",
                "accept_states": ["q1"],
                "transitions": {
                    "q0": {"0": "q1", "1": "q0"},
                    "q1": {"0": "q0", "1": "q1"}
                }
            }
        }
    )
    states: List[str] = Field(..., description="Finite set of states, e.g. ['q0', 'q1']")
    alphabet: List[str] = Field(..., description="Input alphabet symbols, e.g. ['0', '1']")
    start_state: str = Field(..., description="Initial state")
    accept_states: List[str] = Field(default_factory=list, description="Set of accepting/final states")
    transitions: Dict[str, Dict[str, str]] = Field(
        ...,
        description="Transition function: state -> symbol -> next_state"
    )

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    unreachable_states: List[str] = Field(default_factory=list)
    trap_or_dead_states: List[str] = Field(default_factory=list)

class SimulationStep(BaseModel):
    step_index: int
    from_state: str
    symbol: str
    to_state: str
    is_accepting: bool

class SimulationRequest(BaseModel):
    dfa: DFAModel
    input_string: str = Field(default="", description="Input string over alphabet; empty string is ε")

class SimulationResult(BaseModel):
    accepted: bool
    input_string: str
    path: List[str]
    steps: List[SimulationStep]
    final_state: str
    is_empty_string: bool = False

class EquivalenceRequest(BaseModel):
    dfa_a: DFAModel
    dfa_b: DFAModel

class EquivalenceResult(BaseModel):
    is_equivalent: bool
    counterexample: Optional[str] = None
    dfa_a_accepted: Optional[bool] = None
    dfa_b_accepted: Optional[bool] = None
    dfa_a_path: List[str] = Field(default_factory=list)
    dfa_b_path: List[str] = Field(default_factory=list)
    dfa_a_steps: List[SimulationStep] = Field(default_factory=list)
    dfa_b_steps: List[SimulationStep] = Field(default_factory=list)
    product_path: List[Tuple[str, str]] = Field(default_factory=list)
    distinguishing_state: Optional[Tuple[str, str]] = None
    message: str

class MinimizationStep(BaseModel):
    step_number: int
    title: str
    description: str
    partitions: List[List[str]]
    split_details: List[str] = Field(default_factory=list)

class MinimizationRequest(BaseModel):
    dfa: DFAModel

class MinimizationResult(BaseModel):
    original_states_count: int
    minimized_states_count: int
    unreachable_states: List[str]
    reachable_states: List[str]
    steps: List[MinimizationStep]
    final_partitions: List[List[str]]
    minimized_dfa: DFAModel
    is_verified_equivalent: bool

# AI Specific Models
class NaturalLanguageRequest(BaseModel):
    description: str = Field(..., max_length=500, description="English description of formal language")
    alphabet: Optional[List[str]] = Field(default=None, description="Optional specified alphabet")

class LanguageSpecification(BaseModel):
    alphabet: List[str]
    pattern_type: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    description: str
    conditions: List[str] = Field(default_factory=list)
    acceptance_criteria: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    clarification_needed: bool = False
    clarification_question: Optional[str] = None
    is_supported: bool = True

class NaturalLanguageResponse(BaseModel):
    specification: LanguageSpecification
    dfa: Optional[DFAModel] = None
    sample_accepted: List[str] = Field(default_factory=list)
    sample_rejected: List[str] = Field(default_factory=list)
    explanation: str

class CounterexampleExplainRequest(BaseModel):
    dfa_a: DFAModel
    dfa_b: DFAModel
    counterexample: str
    dfa_a_accepted: bool
    dfa_b_accepted: bool
    dfa_a_path: List[str]
    dfa_b_path: List[str]
    product_path: Optional[List[Tuple[str, str]]] = None

class CounterexampleExplainResponse(BaseModel):
    explanation: str
    key_divergence_point: str
    why_shortest: str
    educational_takeaway: str

class CandidateRepair(BaseModel):
    id: str
    title: str
    proposed_transitions: Dict[str, Dict[str, str]]
    description: str
    rationale: str
    is_valid: bool = False
    is_verified_equivalent: bool = False
    counterexample_if_failed: Optional[str] = None
    patched_dfa: Optional[DFAModel] = None

class RepairSuggestionRequest(BaseModel):
    reference_dfa: DFAModel
    student_dfa: DFAModel
    counterexample: str
    expected_acceptance: bool
    student_acceptance: bool
    reference_path: List[str]
    student_path: List[str]

class RepairSuggestionResponse(BaseModel):
    diagnostic_summary: str
    counterexample_analysis: str
    candidate_repairs: List[CandidateRepair]

class HealthStatus(BaseModel):
    status: str
    backend: str
    ai_configured: bool
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None

