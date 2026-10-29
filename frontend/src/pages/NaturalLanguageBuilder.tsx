import React, { useState } from 'react';
import { DFAModel, NaturalLanguageResponse } from '../types/dfa';
import { api } from '../services/api';
import { DfaGraph } from '../components/DfaGraph';
import { DfaSimulator } from '../components/DfaSimulator';
import {
  Wand2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Code2,
  Send,
  Loader2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface NaturalLanguageBuilderProps {
  onExportDfa: (dfa: DFAModel, targetPage: ActivePage) => void;
}

const PRESET_PROMPTS = [
  'Construct a DFA over {0,1} that accepts strings containing an even number of zeros and ending with 1',
  'Accepts binary strings ending with suffix 01 over {0,1}',
  'Accepts strings containing substring 101 over {0,1}',
  'Binary strings that do not contain substring 00 (avoiding 00)',
  'Accepts strings with an even number of 0s over {0,1}',
  'Strings starting with 1 over {0,1}',
];

export const NaturalLanguageBuilder: React.FC<NaturalLanguageBuilderProps> = ({ onExportDfa }) => {
  const [promptText, setPromptText] = useState(PRESET_PROMPTS[0]);
  const [alphabetInput, setAlphabetInput] = useState('0, 1');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NaturalLanguageResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSimState, setActiveSimState] = useState<string | null>(null);

  const handleCompile = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    const cleanAlphabet = alphabetInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const data = await api.interpretLanguage(promptText, cleanAlphabet.length > 0 ? cleanAlphabet : undefined);
      setResponse(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compile language specification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title & Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400 flex items-center justify-center">
            <Wand2 size={18} />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Natural Language to Automaton
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            Feature 1
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Describe a formal regular language in English. The AI parses requirements into a verified
          mathematical specification, while our deterministic TOC engine compiles the complete minimal DFA.
        </p>
      </div>

      {/* Input Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>Natural Language Description</span>
            <span className="text-[10px] font-normal text-slate-500">
              (Supports suffix, substring, avoidance, parity, and composite conditions)
            </span>
          </label>
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. Construct a DFA over {0,1} that accepts strings ending with 01..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-sans text-slate-100 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-slate-500">College TOC Pattern Templates:</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPromptText(p)}
                className="text-[11px] px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-lg transition"
              >
                {p.length > 40 ? p.slice(0, 40) + '...' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Alphabet & Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Alphabet Σ:</span>
            <input
              type="text"
              value={alphabetInput}
              onChange={(e) => setAlphabetInput(e.target.value)}
              placeholder="0, 1"
              className="w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleCompile}
            disabled={loading || !promptText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span>Compile to DFA</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {response && (
        <div className="space-y-6">
          {/* Structured Specification Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Code2 size={16} className="text-cyan-400" />
                <span>Interpreted Formal Specification</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Pattern: {response.specification.pattern_type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-semibold text-slate-300">Formal Language Description:</div>
                <div className="text-slate-400">{response.specification.description}</div>

                <div className="font-semibold text-slate-300 pt-2">Alphabet:</div>
                <div className="font-mono text-cyan-400">
                  {`{${response.specification.alphabet.join(', ')}}`}
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-semibold text-slate-300">Required Conditions:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {response.specification.conditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>

                {response.specification.assumptions.length > 0 && (
                  <>
                    <div className="font-semibold text-slate-300 pt-2">Formal Assumptions:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      {response.specification.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Clarification prompt if model indicated ambiguity */}
            {response.specification.clarification_needed && (
              <div className="p-3 bg-amber-950/40 border border-amber-900 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                <HelpCircle size={15} />
                <span>Clarification: {response.specification.clarification_question}</span>
              </div>
            )}
          </div>

          {/* Compiled DFA Diagram & Export Tools */}
          {response.dfa && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle size={17} className="text-emerald-400" />
                  <span>Compiled & Formally Minimized DFA</span>
                </h3>

                {/* Export buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onExportDfa(response.dfa!, 'doctor')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Share2 size={13} />
                    <span>Send to Doctor</span>
                  </button>
                  <button
                    onClick={() => onExportDfa(response.dfa!, 'equivalence')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Share2 size={13} />
                    <span>Send to Equivalence</span>
                  </button>
                  <button
                    onClick={() => onExportDfa(response.dfa!, 'minimization')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Share2 size={13} />
                    <span>Send to Observatory</span>
                  </button>
                </div>
              </div>

              {/* Graph & Simulator side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <DfaGraph
                    dfa={response.dfa}
                    activeState={activeSimState}
                    height="420px"
                  />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <DfaSimulator
                    dfa={response.dfa}
                    presetString={response.sample_accepted[0] || ''}
                    onActiveStateChange={setActiveSimState}
                  />

                  {/* Sample Accepted & Rejected strings badge row */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-emerald-400 font-mono">
                        Sample Accepted Strings:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {response.sample_accepted.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-rose-400 font-mono">
                        Sample Rejected Strings:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {response.sample_rejected.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

