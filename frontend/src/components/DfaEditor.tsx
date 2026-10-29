import React, { useState } from 'react';
import { DFAModel, ValidationResult } from '../types/dfa';
import { Plus, Trash2, CheckCircle2, AlertTriangle, ArrowRight, Download, Upload, RefreshCw } from 'lucide-react';

interface DfaEditorProps {
  dfa: DFAModel;
  onChange: (updated: DFAModel) => void;
  validation?: ValidationResult | null;
  title?: string;
}

export const DfaEditor: React.FC<DfaEditorProps> = ({
  dfa,
  onChange,
  validation,
  title = "DFA Definition & Transition Table"
}) => {
  const [newStateName, setNewStateName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Add state
  const handleAddState = () => {
    const trimmed = newStateName.trim();
    if (!trimmed) return;
    if (dfa.states.includes(trimmed)) return;

    const updatedStates = [...dfa.states, trimmed];
    const updatedTransitions = { ...dfa.transitions };
    updatedTransitions[trimmed] = {};
    for (const sym of dfa.alphabet) {
      updatedTransitions[trimmed][sym] = trimmed; // default self loop
    }

    onChange({
      ...dfa,
      states: updatedStates,
      transitions: updatedTransitions,
    });
    setNewStateName('');
  };

  // Remove state
  const handleRemoveState = (st: string) => {
    if (dfa.states.length <= 1) return; // Prevent 0 states

    const updatedStates = dfa.states.filter((s) => s !== st);
    const updatedAccept = dfa.accept_states.filter((s) => s !== st);
    const updatedStart = dfa.start_state === st ? updatedStates[0] : dfa.start_state;

    const updatedTransitions: Record<string, Record<string, string>> = {};
    for (const [s, syms] of Object.entries(dfa.transitions)) {
      if (s === st) continue;
      updatedTransitions[s] = {};
      for (const [sym, dst] of Object.entries(syms)) {
        updatedTransitions[s][sym] = dst === st ? updatedStart : dst;
      }
    }

    onChange({
      ...dfa,
      states: updatedStates,
      start_state: updatedStart,
      accept_states: updatedAccept,
      transitions: updatedTransitions,
    });
  };

  // Toggle accept state
  const handleToggleAccept = (st: string) => {
    const isCurrentlyAccept = dfa.accept_states.includes(st);
    const updatedAccept = isCurrentlyAccept
      ? dfa.accept_states.filter((s) => s !== st)
      : [...dfa.accept_states, st];

    onChange({ ...dfa, accept_states: updatedAccept });
  };

  // Set start state
  const handleSetStart = (st: string) => {
    onChange({ ...dfa, start_state: st });
  };

  // Update single transition
  const handleTransitionChange = (srcState: string, symbol: string, dstState: string) => {
    const updatedTransitions = {
      ...dfa.transitions,
      [srcState]: {
        ...(dfa.transitions[srcState] || {}),
        [symbol]: dstState,
      },
    };
    onChange({ ...dfa, transitions: updatedTransitions });
  };

  // Add symbol to alphabet
  const handleAddSymbol = () => {
    const sym = newSymbol.trim();
    if (!sym || sym.length > 2 || dfa.alphabet.includes(sym)) return;

    const updatedAlphabet = [...dfa.alphabet, sym];
    const updatedTransitions = { ...dfa.transitions };

    for (const st of dfa.states) {
      if (!updatedTransitions[st]) updatedTransitions[st] = {};
      updatedTransitions[st][sym] = st; // default self transition
    }

    onChange({
      ...dfa,
      alphabet: updatedAlphabet,
      transitions: updatedTransitions,
    });
    setNewSymbol('');
  };

  // Remove symbol from alphabet
  const handleRemoveSymbol = (sym: string) => {
    if (dfa.alphabet.length <= 1) return;

    const updatedAlphabet = dfa.alphabet.filter((s) => s !== sym);
    const updatedTransitions: Record<string, Record<string, string>> = {};

    for (const [st, syms] of Object.entries(dfa.transitions)) {
      updatedTransitions[st] = {};
      for (const [s, dst] of Object.entries(syms)) {
        if (s !== sym) {
          updatedTransitions[st][s] = dst;
        }
      }
    }

    onChange({
      ...dfa,
      alphabet: updatedAlphabet,
      transitions: updatedTransitions,
    });
  };

  // JSON Import & Export
  const openImportExport = () => {
    setJsonText(JSON.stringify(dfa, null, 2));
    setJsonError(null);
    setJsonModalOpen(true);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.states || !parsed.alphabet || !parsed.start_state || !parsed.transitions) {
        throw new Error('JSON missing mandatory DFA fields (states, alphabet, start_state, transitions).');
      }
      onChange(parsed);
      setJsonModalOpen(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
      {/* Header with Title and Action buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <span>{title}</span>
            {validation && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  validation.is_valid
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                }`}
              >
                {validation.is_valid ? 'Valid DFA' : `${validation.errors.length} Errors`}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete transition function δ: Q × Σ → Q
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openImportExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Import or Export DFA JSON"
          >
            <Upload size={13} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validation && !validation.is_valid && (
        <div className="bg-rose-950/50 border border-rose-900 rounded-lg p-3 text-xs text-rose-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-rose-400">
            <AlertTriangle size={14} /> Formal DFA Incompleteness Detected:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation && validation.warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-3 text-xs text-amber-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle size={14} /> Structural Notes:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alphabet configuration */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Input Alphabet Σ
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {dfa.alphabet.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-cyan-300 border border-cyan-800/60 rounded-md font-mono text-xs"
            >
              <span>'{sym}'</span>
              {dfa.alphabet.length > 1 && (
                <button
                  onClick={() => handleRemoveSymbol(sym)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title={`Remove symbol ${sym}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}

          <div className="flex items-center gap-1">
            <input
              type="text"
              maxLength={2}
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Sym"
              className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleAddSymbol}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
              title="Add alphabet symbol"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* States configuration */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          States Q (Total: {dfa.states.length})
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {dfa.states.map((st) => {
            const isStart = st === dfa.start_state;
            const isAccept = dfa.accept_states.includes(st);

            return (
              <div
                key={st}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
                  isStart
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                    : isAccept
                    ? 'bg-indigo-950/40 border-indigo-700 text-indigo-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <button
                  onClick={() => handleSetStart(st)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isStart
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={isStart ? 'Current Initial State' : 'Set as Initial State'}
                >
                  Start
                </button>

                <button
                  onClick={() => handleToggleAccept(st)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isAccept
                      ? 'bg-indigo-500 text-slate-950 font-bold'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={isAccept ? 'Accepting State (Click to toggle)' : 'Non-accepting (Click to mark accept)'}
                >
                  {isAccept ? 'Accept' : 'Normal'}
                </button>

                <span className="font-semibold text-slate-100">{st}</span>

                {dfa.states.length > 1 && (
                  <button
                    onClick={() => handleRemoveState(st)}
                    className="text-slate-500 hover:text-rose-400 ml-1 transition"
                    title={`Delete state ${st}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              placeholder="State e.g. q2"
              className="w-28 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddState}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Transition Table */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Transition Table δ
        </label>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">State q ∈ Q</th>
                {dfa.alphabet.map((sym) => (
                  <th key={sym} className="py-2.5 px-3 font-semibold text-cyan-400">
                    Input '{sym}'
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60">
              {dfa.states.map((st) => {
                const isStart = st === dfa.start_state;
                const isAccept = dfa.accept_states.includes(st);

                return (
                  <tr key={st} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      {isStart && <span className="text-emerald-400 font-bold">→</span>}
                      {isAccept && <span className="text-indigo-400 font-bold">*</span>}
                      <span>{st}</span>
                    </td>

                    {dfa.alphabet.map((sym) => {
                      const currentDst = dfa.transitions[st]?.[sym] || '';

                      return (
                        <td key={sym} className="py-2.5 px-3">
                          <select
                            value={currentDst}
                            onChange={(e) => handleTransitionChange(st, sym, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
                          >
                            {!dfa.states.includes(currentDst) && (
                              <option value="">Select target</option>
                            )}
                            {dfa.states.map((target) => (
                              <option key={target} value={target}>
                                {target}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-semibold text-slate-100 text-sm">
                Import / Export DFA JSON Definition
              </h4>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {jsonError && (
              <div className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded border border-rose-900">
                {jsonError}
              </div>
            )}

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setJsonModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyJson}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 transition"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

