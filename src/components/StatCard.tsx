import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  statusText?: string;
  statusType?: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  glow?: boolean;
  sparklineData?: number[];
}

const STATUS_STYLES: Record<string, string> = {
  danger:  'text-adcc-danger  border-adcc-danger/30  bg-adcc-danger/10',
  warning: 'text-adcc-warning border-adcc-warning/30 bg-adcc-warning/10',
  success: 'text-adcc-success border-adcc-success/30 bg-adcc-success/10',
  info:    'text-adcc-accent  border-adcc-accent/30  bg-adcc-accent/10',
  neutral: 'text-adcc-textMuted border-adcc-border bg-adcc-surface2/60',
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon, trend, trendDirection = 'neutral',
  statusText, statusType = 'neutral', glow = false, sparklineData
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015, transition: { duration: 0.22 } }}
      className={`tactical-hud-panel rounded-2xl p-5 relative overflow-hidden ${
        glow ? 'border-adcc-accentBorder shadow-glow' : ''
      }`}
    >
      {/* Radial highlight */}
      <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,224,255,0.07) 0%, transparent 70%)' }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-adcc-textMuted font-mono truncate">
            {title}
          </span>
          <span className="text-[28px] font-bold tracking-tight text-adcc-textPrimary leading-none font-mono mt-1">
            {value}
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-adcc-border bg-adcc-surface2/80 text-adcc-accent shrink-0">
          {icon}
        </div>
      </div>

      {/* Sparkline chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-8 w-full mt-3 opacity-90">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((val, idx) => ({ id: idx, val }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={statusType === 'danger' ? '#F43F5E' : statusType === 'warning' ? '#F59E0B' : statusType === 'success' ? '#10B981' : '#00E0FF'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={statusType === 'danger' ? '#F43F5E' : statusType === 'warning' ? '#F59E0B' : statusType === 'success' ? '#10B981' : '#00E0FF'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="val" 
                stroke={statusType === 'danger' ? '#F43F5E' : statusType === 'warning' ? '#F59E0B' : statusType === 'success' ? '#10B981' : '#00E0FF'} 
                fill={`url(#grad-${title.replace(/[^a-zA-Z]/g, '')})`}
                strokeWidth={1.5} 
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-mono font-medium ${
            trendDirection === 'up'   ? 'text-adcc-success' :
            trendDirection === 'down' ? 'text-adcc-danger'  : 'text-adcc-textMuted'
          }`}>
            {trendDirection === 'up'   && <ArrowUpRight   size={13} />}
            {trendDirection === 'down' && <ArrowDownRight size={13} />}
            {trend}
          </span>
        )}
        {statusText && (
          <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-mono font-bold tracking-wider ml-auto ${STATUS_STYLES[statusType]}`}>
            {statusText}
          </span>
        )}
      </div>
    </motion.div>
  );
};
export default StatCard;
