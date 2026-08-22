import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export interface HealthStatus {
  service: string;
  status: 'online' | 'offline' | 'warning';
  latency?: string;
  details?: string;
}

interface SystemHealthProps {
  dbConnected?: boolean;
  apiConnected?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  dbConnected = true, apiConnected = true, onRefresh, isLoading = false
}) => {
  const items: HealthStatus[] = [
    { service: 'PostgreSQL Database',    status: dbConnected  ? 'online' : 'offline', latency: dbConnected  ? '4ms'   : '--', details: dbConnected  ? 'Connected (adcc_db)'              : 'Auth Failure / Offline' },
    { service: 'FastAPI Backend',        status: apiConnected ? 'online' : 'offline', latency: apiConnected ? '12ms'  : '--', details: apiConnected ? 'Running on localhost:8000'         : 'Connection Timeout' },
    { service: 'Open-Meteo Weather',     status: apiConnected ? 'online' : 'offline', latency: apiConnected ? '140ms' : '--', details: 'Active current + forecast models' },
    { service: 'GDACS Disasters Feed',   status: apiConnected ? 'online' : 'offline', latency: apiConnected ? '280ms' : '--', details: 'Listening on RSS XML stream' },
    { service: 'USGS Earthquake API',    status: apiConnected ? 'online' : 'offline', latency: apiConnected ? '190ms' : '--', details: 'Subscribed to earthquake events' },
    { service: 'LangGraph Core Engine',  status: apiConnected ? 'online' : 'offline', latency: '15ms',                        details: 'StateGraph workflow compiled' },
  ];

  return (
    <div className="tactical-hud-panel rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-2">
          <Activity size={13} className="text-adcc-accent" />
          System Diagnostics & Health
        </h3>
        {onRefresh && (
          <button
            disabled={isLoading}
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-adcc-textMuted hover:text-adcc-accent hover:bg-adcc-surface2 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-adcc-surface2/60 border border-adcc-border rounded-xl px-3.5 py-2.5"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-adcc-textSecondary truncate">{item.service}</span>
              <span className="text-[9px] font-mono text-adcc-textMuted truncate">{item.details}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {item.latency && (
                <span className="text-[9px] font-mono text-adcc-textMuted">{item.latency}</span>
              )}
              <span className={`w-2 h-2 rounded-full ${
                item.status === 'online'  ? 'bg-adcc-success shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                item.status === 'offline' ? 'bg-adcc-danger  shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse' :
                                            'bg-adcc-warning shadow-[0_0_6px_rgba(245,158,11,0.5)]'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SystemHealth;
