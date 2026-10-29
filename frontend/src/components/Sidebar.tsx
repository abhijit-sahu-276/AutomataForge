import React from 'react';
import {
  LayoutDashboard,
  Wand2,
  Stethoscope,
  GitCompare,
  Minimize2,
  Bookmark,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export type ActivePage =
  | 'dashboard'
  | 'nl-builder'
  | 'doctor'
  | 'equivalence'
  | 'minimization'
  | 'examples';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const menuItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Home',
    },
    {
      id: 'nl-builder' as ActivePage,
      label: 'Natural Language Builder',
      icon: Wand2,
      badge: 'AI',
    },
    {
      id: 'doctor' as ActivePage,
      label: 'Automata Doctor',
      icon: Stethoscope,
      badge: 'Debug',
    },
    {
      id: 'equivalence' as ActivePage,
      label: 'Equivalence Hunter',
      icon: GitCompare,
      badge: 'BFS',
    },
    {
      id: 'minimization' as ActivePage,
      label: 'Minimization Observatory',
      icon: Minimize2,
      badge: 'Hopcroft',
    },
    {
      id: 'examples' as ActivePage,
      label: 'Saved & College Samples',
      icon: Bookmark,
      badge: 'Lib',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B0F19] flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        <div className="px-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Navigation
          </span>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-900/60 to-indigo-950/40 text-indigo-200 border border-indigo-700/60 shadow-md shadow-indigo-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? 'text-cyan-400'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }
                  />
                  <span>{item.label}</span>
                </div>

                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-indigo-500/30 text-cyan-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mini College Project Notice */}
      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <BookOpen size={13} className="text-indigo-400" />
          <span>TOC Mini-Project</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Covers Deterministic Finite Automata, Product Construction, Hopcroft Partition Refinement, and LLM translation.
        </p>
      </div>
    </aside>
  );
};

