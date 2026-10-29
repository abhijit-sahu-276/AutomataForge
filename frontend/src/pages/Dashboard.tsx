import React, { useState } from 'react';
import { ActivePage } from '../components/Sidebar';
import { DfaGraph } from '../components/DfaGraph';
import { DfaSimulator } from '../components/DfaSimulator';
import { DFAModel } from '../types/dfa';
import {
  Wand2,
  Stethoscope,
  GitCompare,
  Minimize2,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: ActivePage) => void;
  onLoadExampleToEditor?: (dfa: DFAModel) => void;
}

// Interactive sample DFA: Strings containing '101'
const sampleDfa: DFAModel = {
  states: ['q0', 'q1', 'q2', 'q3'],
  alphabet: ['0', '1'],
  start_state: 'q0',
  accept_states: ['q3'],
  transitions: {
    q0: { '0': 'q0', '1': 'q1' },
    q1: { '0': 'q2', '1': 'q1' },
    q2: { '0': 'q0', '1': 'q3' },
    q3: { '0': 'q3', '1': 'q3' },
  },
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [activeSimState, setActiveSimState] = useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-[#0B0F19] border border-indigo-900/50 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Formal Languages & Automata Theory</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            AutomataForge
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            An interactive educational system designed to construct, simulate, minimize,
            compare, and debug Deterministic Finite Automata (DFAs). Powered by rigorous formal
            algorithms and assistive AI explanations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('nl-builder')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Wand2 size={15} />
              <span>Compile Language with AI</span>
            </button>

            <button
              onClick={() => onNavigate('doctor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              <Stethoscope size={15} />
              <span>Diagnose a Buggy DFA</span>
            </button>
          </div>
        </div>

        {/* Subtle geometric background motif */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 3 Main Module Cards + NL Builder */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">
          Core TOC Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Automata Doctor */}
          <div
            onClick={() => onNavigate('doctor')}
            className="group cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-indigo-600/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/30 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
                <Stethoscope size={20} />
              </div>
              <h4 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition">
                Automata Doctor
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare student DFAs against trusted formal references. Discover counterexamples,
                generate targeted candidate transition repairs, and formally verify every fix.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-cyan-300 pt-5">
              <span>Launch Doctor</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Equivalence Hunter */}
          <div
            onClick={() => onNavigate('equivalence')}
            className="group cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-cyan-600/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                <GitCompare size={20} />
              </div>
              <h4 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition">
                Equivalence Hunter
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Determine if two DFAs recognize the exact same language using Cartesian product
                BFS. Produces guaranteed shortest counterexamples when they differ.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 pt-5">
              <span>Hunt Equivalence</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Minimization Observatory */}
          <div
            onClick={() => onNavigate('minimization')}
            className="group cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-violet-600/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/30 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/80 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
                <Minimize2 size={20} />
              </div>
              <h4 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition">
                Minimization Observatory
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect step-by-step partition refinement. Prunes unreachable states, calculates
                0-equivalence, partitions by transition signatures, and merges indistinguishable classes.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-violet-400 group-hover:text-cyan-300 pt-5">
              <span>Open Observatory</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sample Automaton & Simulator Sandbox */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Interactive Automaton Playground
            </h3>
            <p className="text-xs text-slate-400">
              Sample DFA recognizing binary strings containing <code className="text-cyan-400 font-bold">'101'</code>
            </p>
          </div>
          <button
            onClick={() => onNavigate('examples')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Browse All Examples</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <DfaGraph
              dfa={sampleDfa}
              activeState={activeSimState}
              height="400px"
            />
          </div>
          <div className="lg:col-span-5">
            <DfaSimulator
              dfa={sampleDfa}
              presetString="101"
              onActiveStateChange={setActiveSimState}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

