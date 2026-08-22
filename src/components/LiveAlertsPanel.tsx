import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService, { BackendAlert } from '../services/api';
import { ShieldAlert, AlertTriangle, Info, Bell, RefreshCw } from 'lucide-react';

interface LiveAlertsPanelProps {
  limit?: number;
}

const ALERT_STYLES: Record<string, { border: string; icon: React.ReactNode }> = {
  critical: {
    border: 'border-adcc-danger/30 bg-adcc-danger/5 hover:border-adcc-danger/50',
    icon: <ShieldAlert size={13} className="text-adcc-danger animate-pulse shrink-0" />,
  },
  high: {
    border: 'border-adcc-danger/20 bg-adcc-danger/5 hover:border-adcc-danger/35',
    icon: <ShieldAlert size={13} className="text-adcc-danger shrink-0" />,
  },
  medium: {
    border: 'border-adcc-warning/25 bg-adcc-warning/5 hover:border-adcc-warning/40',
    icon: <AlertTriangle size={13} className="text-adcc-warning shrink-0" />,
  },
  low: {
    border: 'border-adcc-border hover:border-adcc-accentBorder bg-adcc-surface2/30',
    icon: <Info size={13} className="text-adcc-accent shrink-0" />,
  },
};

export const LiveAlertsPanel: React.FC<LiveAlertsPanelProps> = ({ limit = 8 }) => {
  const { data: alerts = [], isFetching, error } = useQuery<BackendAlert[]>({
    queryKey: ['liveAlerts'],
    queryFn: apiService.getAlerts,
    refetchInterval: 30000,
  });

  return (
    <div className="tactical-hud-panel rounded-2xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-adcc-accent animate-pulse" />
          <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary">
            Tactical Warnings & Alerts
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <RefreshCw size={10} className="animate-spin text-adcc-accent" />}
          <span className="text-[9px] font-mono text-adcc-textMuted uppercase">Auto-Sync 30s</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 max-h-[360px]">
        {error ? (
          <div className="flex items-center justify-center h-24 text-[11px] font-mono text-adcc-danger">
            TELEMETRY LINK DOWN
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[11px] font-mono text-adcc-textMuted border border-dashed border-adcc-border rounded-xl">
            NO ANOMALOUS SIGNALS DETECTED
          </div>
        ) : (
          alerts.slice(0, limit).map(alert => {
            const sev = alert.severity.toLowerCase();
            const style = ALERT_STYLES[sev] ?? ALERT_STYLES.low;
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 ${style.border}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[11px] font-semibold text-adcc-textPrimary flex items-center gap-1.5 font-mono">
                    {style.icon}
                    {alert.title}
                  </span>
                  <span className="text-[9px] font-mono text-adcc-textMuted shrink-0">
                    {new Date(alert.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-adcc-textMuted">{alert.message}</p>
                <div className="flex items-center justify-between text-[9px] font-mono pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-adcc-textMuted uppercase">Source: {alert.source || 'N/A'}</span>
                  {alert.confidence_score !== undefined && (
                    <span className="text-adcc-accent font-semibold">
                      {Math.round(alert.confidence_score * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default LiveAlertsPanel;
