import React, { useState, useEffect } from 'react';
import { DFAModel, ExampleAutomaton } from '../types/dfa';
import { api } from '../services/api';
import { DfaGraph } from '../components/DfaGraph';
import { DfaSimulator } from '../components/DfaSimulator';
import { ActivePage } from '../components/Sidebar';
import {
  Bookmark,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Share2,
  Stethoscope,
  GitCompare,
  Minimize2,
} from 'lucide-react';

interface SavedExamplesProps {
  onLoadToModule: (dfa: DFAModel, targetPage: ActivePage) => void;
}

export const SavedExamples: React.FC<SavedExamplesProps> = ({ onLoadToModule }) => {
  const [examples, setExamples] = useState<Record<string, ExampleAutomaton>>({});
  const [selectedId, setSelectedId] = useState<string>('even_zeros');
  const [activeSimState, setActiveSimState] = useState<string | null>(null);

  useEffect(() => {
    api.getExamples().then((data) => {
      setExamples(data);
    });
  }, []);

  const selectedExample = examples[selectedId] || null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400 flex items-center justify-center">
            <Bookmark size={18} />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Saved Automata & College TOC Library
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Standard verified Theory of Computation reference automata, unit test strings, and
          deliberately flawed variants for debugging practice.
        </p>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(examples).map((ex) => {
          const isSelected = ex.id === selectedId;

          return (
            <button
              key={ex.id}
              onClick={() => setSelectedId(ex.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      ex.is_faulty
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {ex.is_faulty ? 'Faulty Variant' : 'Verified TOC'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {ex.dfa.states.length} states
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100">{ex.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ex.description}
                </p>
              </div>

              <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                <span>Inspect Automaton</span>
                <ArrowRight size={13} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Example Detail Sandbox */}
      {selectedExample && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedExample.name}</span>
                {selectedExample.is_faulty && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    Intentionally Buggy for Doctor
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedExample.description}
              </p>
            </div>

            {/* Load to Modules Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoadToModule(selectedExample.dfa, 'doctor')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                <Stethoscope size={13} className="text-rose-400" />
                <span>Open in Doctor</span>
              </button>
              <button
                onClick={() => onLoadToModule(selectedExample.dfa, 'equivalence')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                <GitCompare size={13} className="text-cyan-400" />
                <span>Open in Equivalence</span>
              </button>
              <button
                onClick={() => onLoadToModule(selectedExample.dfa, 'minimization')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                <Minimize2 size={13} className="text-violet-400" />
                <span>Open in Observatory</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <DfaGraph
                dfa={selectedExample.dfa}
                activeState={activeSimState}
                height="420px"
              />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <DfaSimulator
                dfa={selectedExample.dfa}
                presetString={selectedExample.test_cases[0]?.string || ''}
                onActiveStateChange={setActiveSimState}
              />

              {/* Verified Test Cases Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  Test Strings & Expected Outcomes:
                </span>
                <div className="space-y-1.5">
                  {selectedExample.test_cases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                    >
                      <span className="text-slate-200">
                        Input:{' '}
                        <span className="text-cyan-400 font-bold">
                          {tc.string === '' ? 'ε' : tc.string}
                        </span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tc.expected
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {tc.expected ? 'ACCEPT' : 'REJECT'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

