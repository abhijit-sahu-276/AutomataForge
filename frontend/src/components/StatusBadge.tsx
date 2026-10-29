import React, { useEffect, useState } from 'react';
import { HealthStatus } from '../types/dfa';
import { api } from '../services/api';
import { Sparkles, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export const StatusBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {/* Backend Status */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
          health?.status === 'ok'
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
            : 'bg-rose-950/40 text-rose-300 border-rose-800'
        }`}
        title={health?.status === 'ok' ? 'FastAPI TOC Engine online' : 'Backend unavailable'}
      >
        <Server size={12} />
        <span className="hidden sm:inline">Backend:</span>
        <span className="font-semibold">{health?.status === 'ok' ? 'Online' : 'Offline'}</span>
      </div>

      {/* AI Status */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
          health?.ai_configured
            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}
        title={
          health?.ai_configured
            ? `LLM connected: ${health.ai_provider} (${health.ai_model})`
            : 'AI Key not configured (Deterministic TOC Mode Active)'
        }
      >
        <Sparkles size={12} className={health?.ai_configured ? 'text-indigo-400' : 'text-slate-500'} />
        <span className="hidden sm:inline">AI:</span>
        <span className="font-semibold">
          {health?.ai_configured ? health.ai_model || 'Active' : 'Deterministic TOC'}
        </span>
      </div>
    </div>
  );
};

