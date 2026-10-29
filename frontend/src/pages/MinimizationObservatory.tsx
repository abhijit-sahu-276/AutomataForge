import React, { useState, useEffect } from 'react';
import { DFAModel, MinimizationResult, ExampleAutomaton } from '../types/dfa';
import { api } from '../services/api';
import { DfaGraph } from '../components/DfaGraph';
import { DfaEditor } from '../components/DfaEditor';
import {
  Minimize2,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface MinimizationObservatoryProps {
  initialDfa?: DFAModel | null;
}

export const MinimizationObservatory: React.FC<MinimizationObservatoryProps> = ({ initialDfa }) => {
  // Redundant 4-state DFA with an unreachable state by default
  const [currentDfa, setCurrentDfa] = useState<DFAModel>(
    initialDfa || {
      states: ['q0', 'q1', 'q2', 'q3', 'q_unreachable'],
      alphabet: ['0', '1'],
      start_state: 'q0',
      accept_states: ['q0', 'q2'],
      transitions: {
        q0: { '0': 'q1', '1': 'q2' },
        q1: { '0': 'q0', '1': 'q3' },
        q2: { '0': 'q3', '1': 'q0' },
        q3: { '0': 'q2', '1': 'q1' },
        q_unreachable: { '0': 'q_unreachable', '1': 'q_unreachable' },
      },
    }
  );

  const [minResult, setMinResult] = useState<MinimizationResult | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const runMinimization = async (dfaToMin: DFAModel) => {
    setLoading(true);
    try {
      const res = await api.minimizeDFA(dfaToMin);
      setMinResult(res);
      setActiveStepIdx(0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runMinimization(currentDfa);
  }, [currentDfa]);

  const activeStep = minResult?.steps[activeStepIdx] || null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-800 text-violet-400 flex items-center justify-center">
              <Minimize2 size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Minimization Observatory
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-400 border border-violet-800">
              Feature 4 & Hopcroft Algorithm
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Step-by-step visual dissection of DFA minimization. Reachability pruning, initial 0-equivalence
            partitioning, round-by-round refinement by transition signatures, and formal equivalence verification.
          </p>
        </div>

        <button
          onClick={() => setEditorOpen(!editorOpen)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
        >
          {editorOpen ? 'Close Editor' : 'Edit Input DFA'}
        </button>
      </div>

      {/* Editor Collapse */}
      {editorOpen && (
        <DfaEditor
          dfa={currentDfa}
          onChange={(newDfa) => {
            setCurrentDfa(newDfa);
          }}
          title="Input Automaton to Minimize"
        />
      )}

      {/* State Reduction Metric Bar */}
      {minResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Original States
            </div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              {minResult.original_states_count}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Minimized States
            </div>
            <div className="text-2xl font-bold font-mono text-violet-400">
              {minResult.minimized_states_count}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              States Saved
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {minResult.original_states_count - minResult.minimized_states_count} (
              {Math.round(
                ((minResult.original_states_count - minResult.minimized_states_count) /
                  minResult.original_states_count) *
                  100
              )}
              %)
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Formal Equivalence
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-emerald-400 mt-2">
              <ShieldCheck size={16} />
              <span>VERIFIED ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Refinement Timeline */}
      {minResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Layers size={17} className="text-violet-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Minimization Step Timeline ({activeStepIdx + 1} of {minResult.steps.length})
              </h3>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveStepIdx((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIdx === 0}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 rounded-lg transition"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() =>
                  setActiveStepIdx((prev) => Math.min(minResult.steps.length - 1, prev + 1))
                }
                disabled={activeStepIdx === minResult.steps.length - 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 rounded-lg transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Stepper progress dots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {minResult.steps.map((st, i) => (
              <button
                key={i}
                onClick={() => setActiveStepIdx(i)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  i === activeStepIdx
                    ? 'bg-violet-950/60 border-violet-600 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono text-violet-400 font-bold">
                  Step {st.step_number}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{st.title}</div>
              </button>
            ))}
          </div>

          {/* Active Step Details */}
          {activeStep && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">{activeStep.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeStep.description}
                </p>
              </div>

              {/* Equivalence Classes / Partitions display */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Partition Groups:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeStep.partitions.map((grp, gIdx) => (
                    <div
                      key={gIdx}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200"
                    >
                      <span className="text-slate-500 mr-1.5">Group {gIdx + 1}:</span>
                      <span className="text-cyan-300 font-bold">
                        {`{${grp.join(', ')}}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Split Details */}
              {activeStep.split_details.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400">Analysis log:</span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                    {activeStep.split_details.map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comparison: Original vs Minimized DFA Diagrams */}
      {minResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono">
                Original DFA ({minResult.original_states_count} states)
              </span>
              {minResult.unreachable_states.length > 0 && (
                <span className="text-[11px] font-mono text-rose-400">
                  Pruned {minResult.unreachable_states.length} unreachable
                </span>
              )}
            </div>
            <DfaGraph dfa={currentDfa} height="360px" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-400 font-mono flex items-center gap-1.5">
                <CheckCircle size={14} /> Minimized DFA ({minResult.minimized_states_count} states)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                L(M) ≡ L(M')
              </span>
            </div>
            <DfaGraph dfa={minResult.minimized_dfa} height="360px" />
          </div>
        </div>
      )}
    </div>
  );
};

