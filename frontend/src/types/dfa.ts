export interface DFAModel {
  states: string[];
  alphabet: string[];
  start_state: string;
  accept_states: string[];
  transitions: Record<string, Record<string, string>>;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  unreachable_states: string[];
  trap_or_dead_states: string[];
}

export interface SimulationStep {
  step_index: number;
  from_state: string;
  symbol: string;
  to_state: string;
  is_accepting: boolean;
}

export interface SimulationResult {
  accepted: boolean;
  input_string: string;
  path: string[];
  steps: SimulationStep[];
  final_state: string;
  is_empty_string: boolean;
}

export interface EquivalenceResult {
  is_equivalent: boolean;
  counterexample?: string | null;
  dfa_a_accepted?: boolean | null;
  dfa_b_accepted?: boolean | null;
  dfa_a_path: string[];
  dfa_b_path: string[];
  dfa_a_steps: SimulationStep[];
  dfa_b_steps: SimulationStep[];
  product_path: [string, string][];
  distinguishing_state?: [string, string] | null;
  message: string;
}

export interface MinimizationStep {
  step_number: number;
  title: string;
  description: string;
  partitions: string[][];
  split_details: string[];
}

export interface MinimizationResult {
  original_states_count: number;
  minimized_states_count: number;
  unreachable_states: string[];
  reachable_states: string[];
  steps: MinimizationStep[];
  final_partitions: string[][];
  minimized_dfa: DFAModel;
  is_verified_equivalent: boolean;
}

export interface LanguageSpecification {
  alphabet: string[];
  pattern_type: string;
  parameters: Record<string, any>;
  description: string;
  conditions: string[];
  acceptance_criteria: string[];
  assumptions: string[];
  clarification_needed: boolean;
  clarification_question?: string | null;
  is_supported: boolean;
}

export interface NaturalLanguageResponse {
  specification: LanguageSpecification;
  dfa?: DFAModel | null;
  sample_accepted: string[];
  sample_rejected: string[];
  explanation: string;
}

export interface CounterexampleExplainResponse {
  explanation: string;
  key_divergence_point: string;
  why_shortest: string;
  educational_takeaway: string;
}

export interface CandidateRepair {
  id: string;
  title: string;
  proposed_transitions: Record<string, Record<string, string>>;
  description: string;
  rationale: string;
  is_valid: boolean;
  is_verified_equivalent: boolean;
  counterexample_if_failed?: string | null;
  patched_dfa?: DFAModel | null;
}

export interface RepairSuggestionResponse {
  diagnostic_summary: string;
  counterexample_analysis: string;
  candidate_repairs: CandidateRepair[];
}

export interface HealthStatus {
  status: string;
  backend: string;
  ai_configured: boolean;
  ai_provider?: string | null;
  ai_model?: string | null;
}

export interface ExampleAutomaton {
  id: string;
  name: string;
  description: string;
  dfa: DFAModel;
  is_faulty?: boolean;
  target_reference_id?: string;
  test_cases: { string: string; expected: boolean }[];
}

