import {
  DFAModel,
  ValidationResult,
  SimulationResult,
  EquivalenceResult,
  MinimizationResult,
  NaturalLanguageResponse,
  CounterexampleExplainResponse,
  RepairSuggestionResponse,
  HealthStatus,
  ExampleAutomaton,
} from '../types/dfa';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getExamples(): Promise<Record<string, ExampleAutomaton>> {
    const res = await fetch(`${API_BASE}/dfa/examples`);
    if (!res.ok) throw new Error(`Failed to load examples: ${res.statusText}`);
    return res.json();
  },

  async validateDFA(dfa: DFAModel): Promise<ValidationResult> {
    const res = await fetch(`${API_BASE}/dfa/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dfa),
    });
    if (!res.ok) throw new Error(`Validation failed: ${res.statusText}`);
    return res.json();
  },

  async simulateDFA(dfa: DFAModel, inputString: string): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/dfa/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dfa, input_string: inputString }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Simulation failed');
    }
    return res.json();
  },

  async checkEquivalence(dfaA: DFAModel, dfaB: DFAModel): Promise<EquivalenceResult> {
    const res = await fetch(`${API_BASE}/dfa/equivalence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dfa_a: dfaA, dfa_b: dfaB }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Equivalence check failed');
    }
    return res.json();
  },

  async minimizeDFA(dfa: DFAModel): Promise<MinimizationResult> {
    const res = await fetch(`${API_BASE}/dfa/minimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dfa }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Minimization failed');
    }
    return res.json();
  },

  async interpretLanguage(description: string, alphabet?: string[]): Promise<NaturalLanguageResponse> {
    const res = await fetch(`${API_BASE}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, alphabet }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'AI interpretation failed');
    }
    return res.json();
  },

  async explainCounterexample(params: {
    dfa_a: DFAModel;
    dfa_b: DFAModel;
    counterexample: string;
    dfa_a_accepted: boolean;
    dfa_b_accepted: boolean;
    dfa_a_path: string[];
    dfa_b_path: string[];
  }): Promise<CounterexampleExplainResponse> {
    const res = await fetch(`${API_BASE}/ai/explain-counterexample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Counterexample explanation failed');
    }
    return res.json();
  },

  async suggestRepairs(params: {
    reference_dfa: DFAModel;
    student_dfa: DFAModel;
    counterexample: string;
    expected_acceptance: boolean;
    student_acceptance: boolean;
    reference_path: string[];
    student_path: string[];
  }): Promise<RepairSuggestionResponse> {
    const res = await fetch(`${API_BASE}/ai/suggest-repairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Repair suggestion failed');
    }
    return res.json();
  },
};

