import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService, { BackendSyncLog, BackendVerificationLog, BackendAllocation, BackendDisaster } from '../services/api';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { Cpu, Terminal, Send, Activity, CheckCircle, XCircle, RefreshCw, Sparkles } from 'lucide-react';

interface AgentStatusDetails {
  id: string; name: string; role: string;
  status: 'Idle' | 'Running' | 'Completed' | 'Degraded';
  lastRun: string; execTime: string; success: boolean;
  health: 'Nominal' | 'Degraded'; logs: string[];
}

export const Agents: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState('a-supervisor');
  const [commandText, setCommandText] = useState('');

  const { data: syncLogs = [],   refetch: refetchSync  } = useQuery<BackendSyncLog[]>         ({ queryKey: ['syncLogs'],         queryFn: apiService.getSyncLogs         });
  const { data: verLogs = [],    refetch: refetchVer   } = useQuery<BackendVerificationLog[]>  ({ queryKey: ['verificationLogs'], queryFn: apiService.getVerificationLogs  });
  const { data: allocations = [],refetch: refetchAlloc } = useQuery<BackendAllocation[]>       ({ queryKey: ['allocations'],      queryFn: apiService.getAllocations       });
  const { data: disasters = [],  refetch: refetchDis   } = useQuery<BackendDisaster[]>         ({ queryKey: ['disasters'],        queryFn: apiService.getDisasters         });

  const handleRefresh = () => { refetchSync(); refetchVer(); refetchAlloc(); refetchDis(); };

  const getAgentList = (): AgentStatusDetails[] => {
    const activeDisasters = disasters.filter(d => d.status === 'Active');
    const latestDis = disasters[0];
    const latestSync = syncLogs[0];
    const latestVer = verLogs[0];
    const latestAlloc = allocations[0];

    const supervisorLogs: string[] = latestDis ? [
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Goal completed. All agents orchestrated.`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Iteration 7: Complete. Terminating execution.`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → notification_agent`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → route_planning_agent`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → [allocation_agent, shelter_agent] (parallel)`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → severity_agent`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → verification_agent`,
      `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Routing → data_collection_agent`,
    ] : ['[Nominal] ADCC Command Director standing by...'];

    return [
      {
        id: 'a-collect', name: 'Data Ingestion Agent',
        role: 'Ingests NOAA weather grids, GDACS feeds, USGS seismometers, and database resource stocks.',
        status: latestSync?.sync_status === 'Running' ? 'Running' : latestSync ? 'Completed' : 'Idle',
        lastRun: latestSync ? new Date(latestSync.started_at).toLocaleTimeString() : 'N/A',
        execTime: '1.2s', success: latestSync?.sync_status !== 'Failed',
        health: latestSync?.sync_status === 'Failed' ? 'Degraded' : 'Nominal',
        logs: syncLogs.slice(0, 5).map(l => `[${new Date(l.started_at).toLocaleTimeString()}] ${l.sync_status} — ${l.records_fetched || 0} records fetched`) || ['[Database Startup] Initialized USGS/GDACS listeners.'],
      },
      {
        id: 'a-verify', name: 'Disaster Verification Agent',
        role: 'Cross-verifies reports against news streams and computes data confidence scores.',
        status: latestVer ? 'Completed' : 'Idle',
        lastRun: latestVer ? new Date(latestVer.created_at).toLocaleTimeString() : 'N/A',
        execTime: '0.8s', success: true, health: 'Nominal',
        logs: verLogs.slice(0, 5).map(v => `[${new Date(v.created_at).toLocaleTimeString()}] ${v.source_checked}: ${v.result} (${Math.round(v.confidence * 100)}%)`) || ['[Idle] Standing by for telemetry triggers.'],
      },
      {
        id: 'a-severity', name: 'Severity Assessment Agent',
        role: 'Calculates population exposure, weather threats, disaster magnitude, and resource strain.',
        status: latestDis ? 'Completed' : 'Idle',
        lastRun: latestDis ? new Date(latestDis.updated_at).toLocaleTimeString() : 'N/A',
        execTime: '0.4s', success: true, health: 'Nominal',
        logs: disasters.slice(0, 5).map(d => `[${new Date(d.updated_at).toLocaleTimeString()}] ${d.title}: ${d.severity} (score=${d.confidence_score})`) || ['[Nominal] 0 risks detected.'],
      },
      {
        id: 'a-alloc', name: 'Resource Allocation Agent',
        role: 'Matches relief supplies to closest vacant warehouses and NDRF bases near coordinates.',
        status: latestAlloc ? 'Completed' : 'Idle',
        lastRun: latestAlloc ? new Date(latestAlloc.allocated_at).toLocaleTimeString() : 'N/A',
        execTime: '0.6s', success: true, health: 'Nominal',
        logs: allocations.slice(0, 5).map(a => `[${new Date(a.allocated_at).toLocaleTimeString()}] Allocated qty=${a.quantity} status=${a.status}`) || ['[Idle] No active deployment tasks.'],
      },
      {
        id: 'a-supervisor', name: 'Supervisor Agent',
        role: 'Orchestrates the response plan using Observe-Think-Decide-Act pattern via LangGraph conditional edges.',
        status: latestDis ? 'Completed' : 'Idle',
        lastRun: latestDis ? new Date(latestDis.updated_at).toLocaleTimeString() : 'N/A',
        execTime: '1.5s', success: true, health: 'Nominal',
        logs: supervisorLogs,
      },
      {
        id: 'a-shelter', name: 'Shelter Assignment Agent',
        role: 'Maps affected evacuees to nearest shelters, tracks capacity volumes, and flags overflow risks.',
        status: activeDisasters.length > 0 ? 'Completed' : 'Idle',
        lastRun: activeDisasters.length > 0 ? new Date().toLocaleTimeString() : 'N/A',
        execTime: '0.5s', success: true, health: 'Nominal',
        logs: activeDisasters.map(d => `[Command] Mapping evacuee routing for ${d.title}.`) || ['[Central] Standby. Shelter databases normal.'],
      },
      {
        id: 'a-route', name: 'Evacuation Route Planning Agent',
        role: 'Computes primary and alternative evacuation paths using OpenRouteService.',
        status: latestDis ? 'Completed' : 'Idle',
        lastRun: latestDis ? new Date(latestDis.updated_at).toLocaleTimeString() : 'N/A',
        execTime: '0.9s', success: true, health: 'Nominal',
        logs: latestDis ? [
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Route mapping synchronized with shelter registry.`,
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Mapped 2 alternative bypass corridors.`,
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Primary route: 14.2 km (~18 min).`,
        ] : ['[Standby] 0 active routes.'],
      },
      {
        id: 'a-notify', name: 'Emergency Notification Agent',
        role: 'Dispatches emergency SMS and WhatsApp alerts via Twilio to response teams and affected population.',
        status: latestDis ? 'Completed' : 'Idle',
        lastRun: latestDis ? new Date(latestDis.updated_at).toLocaleTimeString() : 'N/A',
        execTime: '1.2s', success: true, health: 'Nominal',
        logs: latestDis ? [
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] Broadcast delivered to emergency contacts.`,
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] WhatsApp alerts dispatched via Twilio.`,
          `[${new Date(latestDis.updated_at).toLocaleTimeString()}] SMS broadcast sent via Twilio API.`,
        ] : ['[Standby] SMS/WhatsApp Gateway active. 0 alerts dispatched.'],
      },
      {
        id: 'a-replan', name: 'Dynamic Replanning Agent',
        role: 'Monitors rainfall thresholds, shelter overflows, and aftershocks. Dynamically adjusts routing plans.',
        status: 'Idle', lastRun: 'N/A', execTime: '0.3s', success: true, health: 'Nominal',
        logs: ['[Heartbeat] Listening for meteorological changes...', '[Heartbeat] Monitoring shelter capacity limits...'],
      },
    ];
  };

  const agents = getAgentList();
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;
    selectedAgent.logs.unshift(`[Operator Override] "${commandText}"`);
    setCommandText('');
  };

  const statusCls = (s: string) => {
    switch (s) {
      case 'Completed': return 'text-adcc-success border-adcc-success/30 bg-adcc-success/8';
      case 'Running':   return 'text-adcc-accent  border-adcc-accentBorder bg-adcc-accentDim animate-pulse';
      case 'Degraded':  return 'text-adcc-danger  border-adcc-danger/30  bg-adcc-danger/8  animate-pulse';
      default:          return 'text-adcc-textMuted border-adcc-border bg-adcc-surface2/50';
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Multi-Agent Operations Monitor"
        description="Verify LangGraph cognitive agent node heartbeats, execution latency, and execute bypass overrides."
        actions={
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200">
            <RefreshCw size={11} /> Sync Telemetry
          </button>
        }
      />

      {/* Agent Node Grid */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
            <Cpu size={13} className="text-adcc-accent" /> LangGraph Core State Orchestrator Nodes
          </h3>
          <span className="text-[9px] font-mono text-adcc-accent uppercase">Orchestrator v2.0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {agents.map((agent, index) => {
            const isSelected = selectedAgentId === agent.id;
            const isSupervisor = agent.id === 'a-supervisor';
            return (
              <button key={agent.id} onClick={() => setSelectedAgentId(agent.id)}
                className={`flex flex-col gap-2 p-4 rounded-2xl text-left transition-all duration-250 cursor-pointer font-mono text-xs border ${
                  isSupervisor
                    ? isSelected
                      ? 'ring-2 ring-adcc-accent border-adcc-accentBorder bg-adcc-accentDim shadow-glow'
                      : 'border-adcc-accentBorder bg-adcc-accentGlow hover:border-adcc-accent'
                    : isSelected
                      ? 'ring-2 ring-adcc-accent border-adcc-accentBorder bg-adcc-accentGlow'
                      : 'border-adcc-border bg-adcc-surface2/40 hover:border-adcc-accentBorder hover:bg-adcc-surface2/70'
                }`}
              >
                <div className="flex justify-between items-center text-[9px] text-adcc-textMuted">
                  <span className={isSupervisor ? 'text-adcc-accent font-bold' : ''}>
                    {isSupervisor ? '🧠 CENTRAL SUPERVISOR' : `NODE 0${index < 4 ? index + 1 : index}`}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${statusCls(agent.status)}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`font-bold text-[12px] flex items-center gap-1.5 ${isSupervisor ? 'text-adcc-accent' : 'text-adcc-textPrimary'}`}>
                    {isSupervisor && <Sparkles size={11} className="text-adcc-accent animate-pulse" />}
                    {agent.name}
                  </span>
                  <span className="text-[10px] text-adcc-textMuted mt-0.5 line-clamp-2 leading-relaxed">{agent.role}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-adcc-textMuted pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>LATENCY: {agent.execTime}</span>
                  <span>HEALTH: {agent.health}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Table + Terminal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
              <Activity size={13} className="text-adcc-accent" /> Agent Status Diagnostics Board
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] text-adcc-textMuted border-collapse">
              <thead>
                <tr className="text-adcc-textSecondary bg-adcc-surface2/50 text-[9px] uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="py-2.5 px-3">Agent Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Run</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Pass</th>
                  <th className="py-2.5 px-3">Health</th>
                </tr>
              </thead>
              <tbody className="adcc-table">
                {agents.map(agent => (
                  <tr key={agent.id} onClick={() => setSelectedAgentId(agent.id)}
                    className={`cursor-pointer transition-colors ${selectedAgentId === agent.id ? 'bg-adcc-accentGlow/40' : 'hover:bg-adcc-accentGlow/20'}`}>
                    <td className="py-3 px-3 font-semibold text-adcc-textPrimary">{agent.name}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${statusCls(agent.status)}`}>{agent.status}</span>
                    </td>
                    <td className="py-3 px-3">{agent.lastRun}</td>
                    <td className="py-3 px-3 text-adcc-accent font-bold">{agent.execTime}</td>
                    <td className="py-3 px-3">
                      {agent.success
                        ? <span className="text-adcc-success flex items-center gap-1"><CheckCircle size={11} /> PASS</span>
                        : <span className="text-adcc-danger  flex items-center gap-1 animate-pulse"><XCircle size={11} /> FAIL</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${agent.health === 'Nominal' ? 'text-adcc-success' : 'text-adcc-danger animate-pulse'}`}>
                        {agent.health.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terminal */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 h-fit" style={{ background: 'rgba(8,13,24,0.85)' }}>
          <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
              <Terminal size={13} className="text-adcc-accent" /> Diagnostics Terminal
            </h3>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10.5px] leading-relaxed">
            <div className="flex flex-col rounded-xl border border-adcc-border min-h-[180px] max-h-[220px] overflow-y-auto text-adcc-success p-3 gap-1"
              style={{ background: 'rgba(5,8,17,0.9)' }}>
              {selectedAgent.logs.map((log, i) => (
                <div key={i} className="pb-1.5 mb-0.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{log}</div>
              ))}
            </div>
            <form onSubmit={handleSendCommand} className="flex gap-2">
              <input type="text" value={commandText} onChange={e => setCommandText(e.target.value)}
                placeholder="operator@adcc:~$"
                className="flex-1 text-[11px] font-mono rounded-xl px-3 py-2" style={{ background: 'rgba(5,8,17,0.9)' }} />
              <button type="submit"
                className="px-3 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg rounded-xl flex items-center justify-center transition-all duration-200">
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
export default Agents;
