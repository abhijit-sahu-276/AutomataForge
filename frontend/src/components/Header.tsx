import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Cpu, Terminal } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Cpu size={20} className="animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>AutomataForge</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              v1.0 TOC
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            AI-Assisted Formal Language Compiler & Automata Analysis System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusBadge />
      </div>
    </header>
  );
};

