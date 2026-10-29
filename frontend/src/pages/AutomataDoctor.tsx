import React, { useState, useEffect } from 'react';
import { DFAModel, EquivalenceResult, RepairSuggestionResponse, CandidateRepair, ExampleAutomaton } from '../types/dfa';
import { api } from '../services/api';
import { DfaGraph } from '../components/DfaGraph';
import { DfaEditor } from '../components/DfaEditor';
import {
  Stethoscope,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Check,
  RotateCcw,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface AutomataDoctorProps {
  initialStudentDfa?: DFAModel | null;
}

export const AutomataDoctor: React.FC<AutomataDoctorProps> = ({ initialStudentDfa }) => {
  const [examples, setExamples] = useState<Record<string, ExampleAutomaton>>({});
  const [refDfa, setRefDfa] = useState<DFAModel>({
    states: ['q0', 'q1', 'q2'],
    alphabet: ['0', '1'],
    start_state: 'q0',
    accept_states: ['q2'],
    transitions: {
      q0: { '0': 'q1', '1': 'q0' },
      q1: { '0': 'q1', '1': 'q2' },
      q2: { '0': 'q1', '1': 'q0' },
    },
  });

  const [stuDfa, setStuDfa] = useState<DFAModel>(
    initialStudentDfa || {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      start_state: 'q0',
      accept_states: ['q2'],
      transitions: {
        q0: { '0': 'q1', '1': 'q0' },
        q1: { '0': 'q1', '1': 'q0' }, // Intentionally buggy transition on symbol '1'
        q2: { '0': 'q1', '1': 'q0' },
      },
    }
  );

  const [eqResult, setEqResult] = useState<EquivalenceResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [repairData, setRepairData] = useState<RepairSuggestionResponse | null>(null);
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'edit'>('visual');

  // Load backend examples on mount
  useEffect(() => {
    api.getExamples().then((exs) => {
      setExamples(exs);
      if (!initialStudentDfa && exs['faulty_ends_with_01']) {
        setStuDfa(exs['faulty_ends_with_01'].dfa);
        if (exs['ends_with_01']) {
          setRefDfa(exs['ends_with_01'].dfa);
        }
      }
    });
  }, [initialStudentDfa]);

  // Run equivalence diagnosis
  const handleDiagnose = async () => {
    setChecking(true);
    setRepairData(null);
    try {
      const res = await api.checkEquivalence(refDfa, stuDfa);
      setEqResult(res);

      if (!res.is_equivalent && res.counterexample) {
        // Automatically request AI candidate repairs
        setLoadingRepairs(true);
        const repairs = await api.suggestRepairs({
          reference_dfa: refDfa,
          student_dfa: stuDfa,
          counterexample: res.counterexample,
          expected_acceptance: res.dfa_a_accepted ?? false,
          student_acceptance: res.dfa_b_accepted ?? false,
          reference_path: res.dfa_a_path,
          student_path: res.dfa_b_path,
        });
        setRepairData(repairs);
        setLoadingRepairs(false);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  // Run diagnosis on initial load or change
  useEffect(() => {
    handleDiagnose();
  }, [refDfa, stuDfa]);

  // Apply a candidate fix to student DFA
  const handleApplyFix = (candidate: CandidateRepair) => {
    if (candidate.patched_dfa) {
      setStuDfa(candidate.patched_dfa);
    } else if (candidate.proposed_transitions) {
      setStuDfa({
        ...stuDfa,
        transitions: candidate.proposed_transitions,
      });
    }
  };

  const loadPresetPair = (presetKey: string) => {
    if (presetKey === 'faulty_01') {
      if (examples['ends_with_01']) setRefDfa(examples['ends_with_01'].dfa);
      if (examples['faulty_ends_with_01']) setStuDfa(examples['faulty_ends_with_01'].dfa);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Stethoscope size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Automata Doctor
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
              Feature 2 & AI Repair
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Diagnose student automata against reference languages. Discovers shortest counterexamples,
            pinpoints divergence points, and synthesizes formally verified repairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPresetPair('faulty_01')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Load Buggy '01' Sample
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'visual' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Side-by-Side Visual
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'edit' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Edit Transitions
            </button>
          </div>
        </div>
      </div>

      {/* Diagnosis Verdict Card */}
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
                  <span>{eqResult.is_equivalent ? 'Language Equivalence Confirmed' : 'Divergence Found (Buggy Student DFA)'}</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {eqResult.message}
                </p>
              </div>
            </div>

            {!eqResult.is_equivalent && eqResult.counterexample && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center min-w-[140px]">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Counterexample
                </div>
                <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                  '{eqResult.counterexample}'
                </div>
              </div>
            )}
          </div>

          {/* Trace Comparison Table if buggy */}
          {!eqResult.is_equivalent && eqResult.counterexample && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center justify-between">
                  <span>Reference DFA Path:</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                    Expected: {eqResult.dfa_a_accepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </div>
                <div className="text-slate-300">
                  {eqResult.dfa_a_path.join(' → ')}
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-rose-400 flex items-center justify-between">
                  <span>Student DFA Path:</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800">
                    Actual: {eqResult.dfa_b_accepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </div>
                <div className="text-slate-300">
                  {eqResult.dfa_b_path.join(' → ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side-by-side or Editor View */}
      {activeTab === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <ShieldCheck size={14} /> Reference (Intended Language)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {refDfa.states.length} states
              </span>
            </div>
            <DfaGraph
              dfa={refDfa}
              activeState={eqResult?.dfa_a_path ? eqResult.dfa_a_path[eqResult.dfa_a_path.length - 1] : null}
              height="360px"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1.5">
                <Wrench size={14} /> Student DFA (Under Diagnosis)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {stuDfa.states.length} states
              </span>
            </div>
            <DfaGraph
              dfa={stuDfa}
              activeState={eqResult?.dfa_b_path ? eqResult.dfa_b_path[eqResult.dfa_b_path.length - 1] : null}
              highlightDifferState={eqResult?.dfa_b_path ? eqResult.dfa_b_path[eqResult.dfa_b_path.length - 1] : null}
              height="360px"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DfaEditor
            dfa={refDfa}
            onChange={setRefDfa}
            title="Reference DFA (Expected Language)"
          />
          <DfaEditor
            dfa={stuDfa}
            onChange={setStuDfa}
            title="Student DFA (Under Diagnosis)"
          />
        </div>
      )}

      {/* AI Repair Assistant Candidate Proposals */}
      {eqResult && !eqResult.is_equivalent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                AI Repair Assistant: Candidate Transition Fixes
              </h3>
            </div>
            {loadingRepairs && (
              <span className="flex items-center gap-1 text-xs text-indigo-400 font-mono">
                <Loader2 size={13} className="animate-spin" /> Synthesizing repairs...
              </span>
            )}
          </div>

          {repairData && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {repairData.diagnostic_summary}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repairData.candidate_repairs.map((cand) => (
                  <div
                    key={cand.id}
                    className={`rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                      cand.is_verified_equivalent
                        ? 'bg-emerald-950/20 border-emerald-800/80 hover:border-emerald-500'
                        : 'bg-slate-950/70 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-slate-200">
                          {cand.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            cand.is_verified_equivalent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {cand.is_verified_equivalent ? 'Formally Verified ✓' : 'Fails Verification ✗'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {cand.description}
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        {cand.rationale}
                      </p>

                      {!cand.is_verified_equivalent && cand.counterexample_if_failed && (
                        <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/30 p-1.5 rounded">
                          Disproven by counterexample: '{cand.counterexample_if_failed}'
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleApplyFix(cand)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          cand.is_verified_equivalent
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Check size={13} />
                        <span>Apply This Fix</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

