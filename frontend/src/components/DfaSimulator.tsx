import React, { useState, useEffect, useRef } from 'react';
import { DFAModel, SimulationResult } from '../types/dfa';
import { api } from '../services/api';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface DfaSimulatorProps {
  dfa: DFAModel;
  onActiveStateChange?: (state: string | null) => void;
  presetString?: string;
}

export const DfaSimulator: React.FC<DfaSimulatorProps> = ({
  dfa,
  onActiveStateChange,
  presetString = '',
}) => {
  const [inputString, setInputString] = useState(presetString);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(800);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Run simulation whenever input or DFA changes
  const runSimulation = async (strToRun: string) => {
    try {
      setErrorMsg(null);
      const res = await api.simulateDFA(dfa, strToRun);
      setSimResult(res);
      setCurrentStepIdx(0);
      setIsPlaying(false);
      if (onActiveStateChange) {
        onActiveStateChange(res.path[0] || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation error');
      setSimResult(null);
      if (onActiveStateChange) onActiveStateChange(null);
    }
  };

  useEffect(() => {
    runSimulation(inputString);
  }, [dfa]);

  // Update active state in parent graph when step changes
  useEffect(() => {
    if (simResult && onActiveStateChange) {
      const active = simResult.path[currentStepIdx] || null;
      onActiveStateChange(active);
    }
  }, [currentStepIdx, simResult]);

  // Timer playback loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && simResult) {
      if (currentStepIdx < simResult.steps.length) {
        timer = setTimeout(() => {
          setCurrentStepIdx((prev) => prev + 1);
        }, speedMs);
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIdx, simResult, speedMs]);

  const handleStepForward = () => {
    if (!simResult) return;
    if (currentStepIdx < simResult.steps.length) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    if (simResult && onActiveStateChange) {
      onActiveStateChange(simResult.path[0]);
    }
  };

  const currentState = simResult?.path[currentStepIdx] || dfa.start_state;
  const isFinished = simResult ? currentStepIdx >= simResult.steps.length : false;
  const finalAccepted = simResult ? simResult.accepted : false;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">
            Step-by-Step String Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Simulate state transitions symbol-by-symbol (empty string = ε)
          </p>
        </div>

        {simResult && isFinished && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              finalAccepted
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-400 border border-rose-800'
            }`}
          >
            {finalAccepted ? <CheckCircle size={14} /> : <XCircle size={14} />}
            <span>{finalAccepted ? 'STRING ACCEPTED' : 'STRING REJECTED'}</span>
          </div>
        )}
      </div>

      {/* Input Box and Preset Quick buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputString}
              onChange={(e) => {
                setInputString(e.target.value);
                runSimulation(e.target.value);
              }}
              placeholder="e.g. 101 or empty for ε"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
            {inputString === '' && (
              <span className="absolute right-3 top-2 text-xs font-mono text-slate-500 pointer-events-none">
                [Testing ε empty string]
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setInputString('ε');
              runSimulation('');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
            title="Test empty string ε"
          >
            ε (Empty)
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Playback Controls & Timeline */}
      {simResult && (
        <div className="space-y-4 pt-1">
          {/* Stepper bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="Reset to start"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={handleStepBackward}
                disabled={currentStepIdx === 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-lg transition"
                title="Step Backward"
              >
                <SkipBack size={14} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isFinished}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={handleStepForward}
                disabled={isFinished}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 rounded-lg transition"
                title="Step Forward"
              >
                <SkipForward size={14} />
              </button>
            </div>

            {/* Current State Info */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="text-slate-400">
                Step:{' '}
                <span className="text-cyan-400 font-bold">
                  {currentStepIdx} / {simResult.steps.length}
                </span>
              </div>
              <div className="text-slate-400">
                Active State:{' '}
                <span className="text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  {currentState}
                </span>
              </div>
            </div>

            {/* Speed slider */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Speed:</span>
              <input
                type="range"
                min={200}
                max={1500}
                step={100}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-slate-500">{speedMs}ms</span>
            </div>
          </div>

          {/* Stepper visual ribbon */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Execution Path
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {simResult.path.map((st, i) => {
                const isCurrent = i === currentStepIdx;
                const stepObj = i > 0 ? simResult.steps[i - 1] : null;

                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <span className="text-[10px] text-cyan-400 font-bold">
                          '{stepObj?.symbol}'
                        </span>
                        <span>→</span>
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold ring-2 ring-cyan-400 shadow-md scale-105'
                          : i < currentStepIdx
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {st}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

