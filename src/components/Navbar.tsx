import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, ShieldCheck, ShieldAlert, Zap, Clock, Check, Sun, Moon } from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard Overview',
  '/map':        'Tactical Disaster Map',
  '/resources':  'Resource Allocation & Inventory',
  '/agents':     'Multi-Agent Operations',
  '/simulation': 'Crisis Simulation Engine',
  '/ai-command': 'AI Command Center Console',
  '/analytics':  'Historical Reports & Analytics',
  '/settings':   'System Settings',
};

export const Navbar: React.FC<NavbarProps> = ({ setSidebarOpen }) => {
  const { notifications, systemStatus, markAllNotificationsRead } = useSystem();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Autonomous Disaster Command Center';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read);

  const statusConfig = {
    alert:      { text: 'ALERT ACTIVE',      cls: 'text-adcc-danger  bg-adcc-danger/10  border-adcc-danger/30',  Icon: ShieldAlert },
    simulation: { text: 'SIMULATION ACTIVE', cls: 'text-adcc-warning bg-adcc-warning/10 border-adcc-warning/30', Icon: Zap },
    nominal:    { text: 'SYSTEM NOMINAL',    cls: 'text-adcc-success bg-adcc-success/10 border-adcc-success/30', Icon: ShieldCheck },
  };
  const s = statusConfig[(systemStatus as keyof typeof statusConfig)] ?? statusConfig.nominal;
  const StatusIcon = s.Icon;

  return (
    <header className="h-16 border-b border-adcc-border bg-adcc-surface/80 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">

      {/* ── Left: Title ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-adcc-textMuted hover:text-adcc-textPrimary hover:bg-adcc-surface2 lg:hidden transition-colors"
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-[15px] font-semibold text-adcc-textPrimary tracking-tight leading-none">
            {pageTitle}
          </h2>
          <p className="text-[10px] text-adcc-textMuted font-mono mt-0.5 hidden sm:block">
            ADCC · Autonomous Disaster Command Center
          </p>
        </div>
      </div>

      {/* ── Right: Controls ──────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* System status badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider border rounded-full ${s.cls}`}>
          <StatusIcon size={12} />
          <span>{s.text}</span>
        </div>

        {/* Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-adcc-surface2 border border-adcc-border rounded-xl text-[11px] font-mono text-adcc-textMuted">
          <Clock size={12} className="text-adcc-accent" />
          <span>{time.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
          <span className="text-adcc-border">|</span>
          <span className="text-adcc-textPrimary font-semibold tabular-nums">
            {time.toLocaleTimeString(undefined, { hour12: false })}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-adcc-textMuted hover:text-adcc-textPrimary hover:bg-adcc-surface2 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-2 rounded-xl text-adcc-textMuted hover:text-adcc-textPrimary hover:bg-adcc-surface2 transition-colors"
          >
            <Bell size={18} className={unread.length > 0 ? 'animate-[bounce_1.5s_ease-in-out_3]' : ''} />
            {unread.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-adcc-danger text-[9px] font-mono font-bold text-white flex items-center justify-center">
                {unread.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 lg:w-96 glass-panel-heavy rounded-2xl overflow-hidden z-50 shadow-elevated">
              <div className="px-4 py-3 border-b border-adcc-border flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-adcc-textPrimary">
                  System Alerts ({unread.length})
                </span>
                {unread.length > 0 && (
                  <button
                    onClick={() => { markAllNotificationsRead(); setShowNotifications(false); }}
                    className="flex items-center gap-1 text-[10px] font-mono text-adcc-accent hover:text-adcc-textPrimary font-bold uppercase transition-colors"
                  >
                    <Check size={11} /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-adcc-border/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[11px] text-adcc-textMuted font-mono">
                    NO ACTIVE INCIDENT TELEMETRY
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3.5 transition-colors hover:bg-adcc-surface2/50 ${
                        !n.read ? 'border-l-2 border-adcc-accent' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          n.severity === 'critical' ? 'text-adcc-danger' :
                          n.severity === 'warning'  ? 'text-adcc-warning' : 'text-adcc-info'
                        }`}>{n.title}</span>
                        <span className="text-[9px] font-mono text-adcc-textMuted shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-adcc-textMuted mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] font-mono text-adcc-textMuted/60 mt-1.5">Source: {n.source}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-adcc-border">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-adcc-accentDim border border-adcc-accentBorder flex items-center justify-center">
              <span className="text-[11px] font-bold font-mono text-adcc-accent">DC</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-adcc-success border-2 border-adcc-surface" />
          </div>
          <div className="hidden xl:flex flex-col leading-none">
            <span className="text-[12px] font-semibold text-adcc-textPrimary">Dr. Ashfa</span>
            <span className="text-[9px] font-mono text-adcc-accent uppercase font-bold mt-0.5">Duty Commander</span>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
