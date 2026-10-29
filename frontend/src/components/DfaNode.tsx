import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface DfaNodeData {
  label: string;
  isStart: boolean;
  isAccept: boolean;
  isActive?: boolean;
  isHighlightDiffer?: boolean;
}

export const DfaNode: React.FC<{ data: DfaNodeData }> = ({ data }) => {
  const { label, isStart, isAccept, isActive, isHighlightDiffer } = data;

  return (
    <div className="relative group">
      {/* Start State Indicator Arrow */}
      {isStart && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400 font-mono text-xs font-semibold animate-pulse">
          <span>Start</span>
          <span>→</span>
        </div>
      )}

      {/* Main State Circle */}
      <div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-sm select-none transition-all duration-300
          ${
            isActive
              ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-110 ring-4 ring-cyan-300/60'
              : isHighlightDiffer
              ? 'bg-rose-950/80 text-rose-200 border-2 border-rose-500 shadow-md shadow-rose-900/40 ring-4 ring-rose-500/30'
              : isAccept
              ? 'bg-slate-800 text-indigo-200 border-2 border-indigo-400 ring-4 ring-indigo-500/30'
              : 'bg-slate-900 text-slate-200 border-2 border-slate-700 hover:border-slate-500'
          }
        `}
      >
        {/* Inner concentric ring for accept states */}
        {isAccept && (
          <div
            className={`
              absolute inset-1 rounded-full border border-dashed pointer-events-none
              ${isActive ? 'border-white/60' : 'border-indigo-400/80'}
            `}
          />
        )}

        <span className="z-10">{label}</span>
      </div>

      {/* Invisible Handles on 4 sides for clean multi-target edges */}
      <Handle type="target" position={Position.Top} id="top-in" className="opacity-0 w-2 h-2" />
      <Handle type="source" position={Position.Top} id="top-out" className="opacity-0 w-2 h-2" />
      <Handle type="target" position={Position.Bottom} id="bottom-in" className="opacity-0 w-2 h-2" />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className="opacity-0 w-2 h-2" />
      <Handle type="target" position={Position.Left} id="left-in" className="opacity-0 w-2 h-2" />
      <Handle type="source" position={Position.Left} id="left-out" className="opacity-0 w-2 h-2" />
      <Handle type="target" position={Position.Right} id="right-in" className="opacity-0 w-2 h-2" />
      <Handle type="source" position={Position.Right} id="right-out" className="opacity-0 w-2 h-2" />
    </div>
  );
};

