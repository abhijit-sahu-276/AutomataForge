import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActivePage } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NaturalLanguageBuilder } from './pages/NaturalLanguageBuilder';
import { AutomataDoctor } from './pages/AutomataDoctor';
import { EquivalenceHunter } from './pages/EquivalenceHunter';
import { MinimizationObservatory } from './pages/MinimizationObservatory';
import { SavedExamples } from './pages/SavedExamples';
import { DFAModel } from './types/dfa';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [exportedDfa, setExportedDfa] = useState<DFAModel | null>(null);

  const handleExportDfa = (dfa: DFAModel, targetPage: ActivePage) => {
    setExportedDfa(dfa);
    setActivePage(targetPage);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100 font-sans">
      {/* Sidebar navigation */}
      <Sidebar activePage={activePage} onSelectPage={setActivePage} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activePage === 'dashboard' && (
            <Dashboard onNavigate={setActivePage} />
          )}

          {activePage === 'nl-builder' && (
            <NaturalLanguageBuilder onExportDfa={handleExportDfa} />
          )}

          {activePage === 'doctor' && (
            <AutomataDoctor initialStudentDfa={exportedDfa} />
          )}

          {activePage === 'equivalence' && (
            <EquivalenceHunter initialDfaA={exportedDfa} />
          )}

          {activePage === 'minimization' && (
            <MinimizationObservatory initialDfa={exportedDfa} />
          )}

          {activePage === 'examples' && (
            <SavedExamples onLoadToModule={handleExportDfa} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

