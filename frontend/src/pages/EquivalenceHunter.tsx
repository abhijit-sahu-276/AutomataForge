import React, { useState, useEffect } from 'react';
import { DFAModel, EquivalenceResult, CounterexampleExplainResponse, ExampleAutomaton } from '../types/dfa';
import { api } from '../services/api';
import { DfaGraph } from '../components/DfaGraph';
import { DfaEditor } from '../components/DfaEditor';
import {
  GitCompare,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  HelpCircle,
  Loader2,
  Check,
  RotateCw,
  Search,
} from 'lucide-react';

interface EquivalenceHunterProps {
  initialDfaA?: DFAModel | null;
  initialDfaB?: DFAModel | null;
}

export const EquivalenceHunter: React.FC<EquivalenceHunterProps> = ({
  initialDfaA,
  initialDfaB,
}) => {
  const [examples, setExamples] = useState<Record<string, ExampleAutomaton>>({});

  // DFA A: 2 states (even zeros)
  const [dfaA, setDfaA] = useState<DFAModel>(
    initialDfaA || {
      states: ['q_even', 'q_odd'],
      alphabet: ['0', '1'],
      start_state: 'q_even',
      accept_states: ['q_even'],
      transitions: {
        q_even: { '0': 'q_odd', '1': 'q_even' },
        q_odd: { '0': 'q_even', '1': 'q_odd' },
      },
    }
  );

  // DFA B: 4 states (equivalent redundant even zeros)
  const [dfaB, setDfaB] = useState<DFAModel>(
    initialDfaB || {
      states: ['e1', 'o1', 'e2', 'o2'],
      alphabet: ['0', '1'],
      start_state: 'e1',
      accept_states: ['e1', 'e2'],
      transitions: {
        e1: { '0': 'o1', '1': 'e2' },
        o1: { '0': 'e2', '1': 'o2' },
        e2: { '0': 'o2', '1': 'e1' },
        o2: { '0': 'e1', '1': 'o1' },
      },
    }
  );

  const [eqResult, setEqResult] = useState<EquivalenceResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [explainData, setExplainData] = useState<CounterexampleExplainResponse | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'edit'>('visual');

  useEffect(() => {
    api.getExamples().then((exs) => setExamples(exs));
  }, []);

  const runCheck = async () => {
    setChecking(true);
    setExplainData(null);
    try {
      const res = await api.checkEquivalence(dfaA, dfaB);
      setEqResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, [dfaA, dfaB]);

  const handleAskExplainer = async () => {
    if (!eqResult || eqResult.is_equivalent || !eqResult.counterexample) return;
    setLoadingExplain(true);
    try {
      const explanation = await api.explainCounterexample({
        dfa_a: dfaA,
        dfa_b: dfaB,
        counterexample: eqResult.counterexample,
        dfa_a_accepted: eqResult.dfa_a_accepted ?? false,
        dfa_b_accepted: eqResult.dfa_b_accepted ?? false,
        dfa_a_path: eqResult.dfa_a_path,
        dfa_b_path: eqResult.dfa_b_path,
      });
      setExplainData(explanation);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingExplain(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <GitCompare size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Equivalence Hunter
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Feature 3 & BFS Product
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Checks formal language equivalence L(A) = L(B) using synchronous product BFS
            (p, q) → (δA(p, a), δB(q, a)). Discovers guaranteed minimal length counterexamples.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'visual' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Side-by-Side Visual
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'edit' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Edit Transitions
            </button>
          </div>
        </div>
      </div>

      {/* Result Status Banner */}
      {eqResult && (
        <div
          className={`rounded-2xl border p-5 transition-all shadow-xl ${
            eqResult.is_equivalent
              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eqResult.is_equivalent
                    ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-700'
                    : 'bg-rose-900/60 text-rose-400 border border-rose-700'
                }`}
              >
                {eqResult.is_equivalent ? <CheckCircle size={22} /> : <XCircle size={22} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{eqResult.is_equivalent ? 'DFAs are Formally EQUIVALENT' : 'DFAs are NOT Equivalent'}</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {eqResult.message}
                </p>
              </div>
            </div>

            {!eqResult.is_equivalent && eqResult.counterexample && (
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center min-w-[150px]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Shortest Counterexample
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                    '{eqResult.counterexample}'
                  </div>
                </div>

                <button
                  onClick={handleAskExplainer}
                  disabled={loadingExplain}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  {loadingExplain ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span>Ask AI Explainer</span>
                </button>
              </div>
            )}
          </div>

          {/* Trace comparison */}
          {!eqResult.is_equivalent && eqResult.counterexample && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>DFA A Traversal:</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      eqResult.dfa_a_accepted
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    Outcome: {eqResult.dfa_a_accepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </div>
                <div className="text-slate-300">{eqResult.dfa_a_path.join(' → ')}</div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>DFA B Traversal:</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      eqResult.dfa_b_accepted
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    Outcome: {eqResult.dfa_b_accepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </div>
                <div className="text-slate-300">{eqResult.dfa_b_path.join(' → ')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Counterexample Explainer Panel */}
      {explainData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm border-b border-slate-800 pb-3">
            <Sparkles size={17} />
            <span>AI Counterexample Explainer</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {explainData.explanation}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-cyan-400 font-mono">Divergence Point:</span>
              <p className="text-slate-400">{explainData.key_divergence_point}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-indigo-400 font-mono">BFS Shortest Guarantee:</span>
              <p className="text-slate-400">{explainData.why_shortest}</p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Visual or Edit View */}
      {activeTab === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">DFA A</span>
              <span className="text-xs text-slate-500 font-mono">{dfaA.states.length} states</span>
            </div>
            <DfaGraph
              dfa={dfaA}
              activeState={eqResult?.dfa_a_path ? eqResult.dfa_a_path[eqResult.dfa_a_path.length - 1] : null}
              height="360px"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">DFA B</span>
              <span className="text-xs text-slate-500 font-mono">{dfaB.states.length} states</span>
            </div>
            <DfaGraph
              dfa={dfaB}
              activeState={eqResult?.dfa_b_path ? eqResult.dfa_b_path[eqResult.dfa_b_path.length - 1] : null}
              highlightDifferState={eqResult?.dfa_b_path ? eqResult.dfa_b_path[eqResult.dfa_b_path.length - 1] : null}
              height="360px"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DfaEditor dfa={dfaA} onChange={setDfaA} title="DFA A Definition" />
          <DfaEditor dfa={dfaB} onChange={setDfaB} title="DFA B Definition" />
        </div>
      )}
    </div>
  );
};

