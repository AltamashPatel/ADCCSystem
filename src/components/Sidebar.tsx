import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Package, Cpu, Play,
  Terminal, BarChart3, Settings as SettingsIcon,
  Shield, Activity, X, Radio
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const menuItems = [
  { name: 'Dashboard',        path: '/',           icon: LayoutDashboard },
  { name: 'Disaster Map',     path: '/map',         icon: Map },
  { name: 'Resources',        path: '/resources',   icon: Package },
  { name: 'Agents',           path: '/agents',      icon: Cpu },
  { name: 'Simulation',       path: '/simulation',  icon: Play },
  { name: 'AI Command Center',path: '/ai-command',  icon: Terminal },
  { name: 'Analytics',        path: '/analytics',   icon: BarChart3 },
  { name: 'Settings',         path: '/settings',    icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { systemStatus, disasters } = useSystem();
  const activeCount = disasters.filter(d => d.status === 'active').length;

  const statusDot =
    systemStatus === 'alert'      ? 'bg-adcc-danger'   :
    systemStatus === 'simulation' ? 'bg-adcc-warning'  :
                                    'bg-adcc-success';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 modal-overlay lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64
        bg-adcc-surface border-r border-adcc-border
        transition-transform duration-300 ease-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Brand Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-adcc-border"
          style={{ background: 'linear-gradient(135deg, rgba(0,224,255,0.04) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-adcc-accentDim border border-adcc-accentBorder">
              <Shield size={18} className="text-adcc-accent" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-adcc-surface status-pulse-dot ${statusDot}`} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-widest text-adcc-textPrimary font-mono">ADCC</span>
              <span className="text-[9px] font-semibold tracking-widest text-adcc-accent uppercase mt-0.5">Command Center</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-adcc-textMuted hover:text-adcc-textPrimary hover:bg-adcc-surface2 lg:hidden transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm
                  font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-adcc-accentDim text-adcc-accent'
                    : 'text-adcc-textMuted hover:bg-adcc-surface2 hover:text-adcc-textSecondary'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="nav-active-indicator" />}
                    <div className="flex items-center gap-3 pl-1">
                      <Icon size={17} className={isActive ? 'text-adcc-accent' : 'text-adcc-textMuted group-hover:text-adcc-textSecondary transition-colors'} />
                      <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                    </div>
                    {item.name === 'Disaster Map' && activeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-adcc-danger/20 text-adcc-danger border border-adcc-danger/30 rounded-full">
                        {activeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer Telemetry ─────────────────────────────── */}
        <div className="p-3 border-t border-adcc-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-adcc-surface2 border border-adcc-border">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-adcc-accentDim border border-adcc-accentBorder">
              <Radio size={13} className="text-adcc-accent" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-adcc-textMuted">Network Stream</span>
              <span className="text-[11px] font-mono font-semibold text-adcc-success truncate">CONNECTED · 240.8G</span>
            </div>
            <Activity size={12} className="text-adcc-success ml-auto animate-pulse shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
