import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { BackendResource, BackendDisaster, BackendAllocation } from '../services/api';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import {
  Boxes, Truck, Plus, Minus, ShieldAlert, Navigation,
  Warehouse, HeartPulse, Ship, Ambulance, CheckCircle,
  FileSpreadsheet, Cpu
} from 'lucide-react';

export const Resources: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<BackendResource[]>({ queryKey: ['resources'], queryFn: apiService.getResources });
  const { data: disasters = [] } = useQuery<BackendDisaster[]>({ queryKey: ['disasters'], queryFn: apiService.getDisasters });
  const { data: allocations = [] } = useQuery<BackendAllocation[]>({ queryKey: ['allocations'], queryFn: apiService.getAllocations });

  const [selectedDisasterId, setSelectedDisasterId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [dispatchQty, setDispatchQty] = useState(1);
  const [dispatchReason, setDispatchReason] = useState('');
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiRecommend = async () => {
    if (!selectedDisasterId) { setDispatchError('Select a target disaster first.'); return; }
    setIsAiLoading(true); setDispatchError(null);
    try {
      const rec = await apiService.recommendAllocation(selectedDisasterId);
      setSelectedResourceId(rec.resource_id);
      setDispatchQty(rec.quantity);
      setDispatchReason(rec.recommendation_reason);
      setDispatchSuccess(false);
    } catch (err: any) {
      setDispatchError(err.response?.data?.detail || 'Failed to fetch AI recommendation.');
    } finally { setIsAiLoading(false); }
  };

  const handleAiAutoDispatch = async () => {
    if (!selectedDisasterId) { setDispatchError('Select a target disaster first.'); return; }
    setIsAiLoading(true); setDispatchError(null);
    try {
      const rec = await apiService.recommendAllocation(selectedDisasterId);
      dispatchMutation.mutate({ disaster_id: selectedDisasterId, resource_id: rec.resource_id, quantity: rec.quantity, allocation_reason: rec.recommendation_reason });
    } catch (err: any) {
      setDispatchError(err.response?.data?.detail || 'Failed to auto-dispatch.');
    } finally { setIsAiLoading(false); }
  };

  const dispatchMutation = useMutation({
    mutationFn: async (p: { disaster_id: string; resource_id: string; quantity: number; allocation_reason: string }) =>
      apiService.createAllocation({ ...p, status: 'Active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      setDispatchSuccess(true); setDispatchError(null); setDispatchQty(1); setDispatchReason('');
      setTimeout(() => setDispatchSuccess(false), 4000);
    },
    onError: (err: any) => setDispatchError(err.response?.data?.detail || 'Database dispatch failed.'),
  });

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisasterId || !selectedResourceId || dispatchQty <= 0) { setDispatchError('Specify disaster, resource, and positive quantity.'); return; }
    const res = resources.find(r => r.id === selectedResourceId);
    if (!res || res.quantity < dispatchQty) { setDispatchError('Insufficient resource quantity in stock.'); return; }
    dispatchMutation.mutate({ disaster_id: selectedDisasterId, resource_id: selectedResourceId, quantity: dispatchQty, allocation_reason: dispatchReason || 'Command Center Manual Dispatch' });
  };

  const totalFleetUnits = resources.reduce((s, r) => s + r.quantity, 0);
  const availableUnits  = resources.filter(r => r.status === 'Available').reduce((s, r) => s + r.quantity, 0);
  const busyUnits       = resources.filter(r => r.status === 'Busy').reduce((s, r) => s + r.quantity, 0);
  const maintUnits      = resources.filter(r => r.status === 'Maintenance').reduce((s, r) => s + r.quantity, 0);

  const getResourceIcon = (type: string, size = 14) => {
    switch (type.toLowerCase()) {
      case 'boat':         return <Ship       size={size} className="text-[#38BDF8]"       />;
      case 'ambulance':    return <Ambulance  size={size} className="text-adcc-warning"    />;
      case 'medical_team': return <HeartPulse size={size} className="text-adcc-accent"     />;
      case 'ndrf_unit':    return <Warehouse  size={size} className="text-adcc-success"    />;
      default:             return <Boxes      size={size} className="text-purple-400"      />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':   return 'text-adcc-success border-adcc-success/30 bg-adcc-success/8';
      case 'busy':        return 'text-adcc-warning border-adcc-warning/30 bg-adcc-warning/8';
      default:            return 'text-adcc-danger  border-adcc-danger/30  bg-adcc-danger/8  animate-pulse';
    }
  };

  const getAllocationLabel = (id: string) => {
    const a = allocations.find(a => a.resource_id === id && a.status === 'Active');
    if (!a) return 'Unallocated (Depot Reserves)';
    const d = disasters.find(d => d.id === a.disaster_id);
    return d ? `Deployed: ${d.title}` : 'Deployed to Active Incident';
  };

  const kpiCards = [
    { label: 'Total Fleet',       value: totalFleetUnits, color: 'text-adcc-textPrimary' },
    { label: 'Ready / Available', value: availableUnits,  color: 'text-adcc-success'     },
    { label: 'Deployed / Busy',   value: busyUnits,       color: 'text-adcc-warning'     },
    { label: 'In Maintenance',    value: maintUnits,      color: 'text-adcc-danger'      },
  ];

  const inputCls = "w-full text-[11px] font-mono rounded-xl px-3 py-2.5";
  const labelCls = "text-[10px] font-mono uppercase font-semibold text-adcc-textMuted";

  return (
    <PageContainer>
      <SectionHeader
        title="Resource Ingestion & Deployment"
        description="Monitor responder reserves, deploy manual overrides, and view log sheets."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, color }) => (
          <div key={label} className="glass-panel rounded-2xl p-4 flex flex-col gap-1.5">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${color}`}>{label}</span>
            <span className={`text-2xl font-bold font-mono ${color}`}>
              {value} <span className="text-xs font-normal text-adcc-textMuted">units</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Resource Table */}
        <div className="xl:col-span-2">
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
                <FileSpreadsheet size={13} className="text-adcc-accent" />
                Live Command Inventory Registry
              </h3>
              <span className="text-[9px] font-mono text-adcc-accent uppercase">Live Ingest ({resources.length} nodes)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-adcc-textMuted border-collapse">
                <thead>
                  <tr className="text-adcc-textSecondary bg-adcc-surface2/50 text-[9px] uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="py-2.5 px-3">Resource Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Deployment</th>
                  </tr>
                </thead>
                <tbody className="adcc-table">
                  {resourcesLoading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-[11px] text-adcc-textMuted animate-pulse">TUNING LOGISTICS TELEMETRY LINKS...</td></tr>
                  ) : resources.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-[11px] text-adcc-textMuted">NO RESOURCE REGISTRIES DETECTED</td></tr>
                  ) : resources.map(res => (
                    <tr key={res.id} className="hover:bg-adcc-accentGlow/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-adcc-textPrimary">
                        <span className="flex items-center gap-1.5">{getResourceIcon(res.resource_type)}{res.resource_name}</span>
                      </td>
                      <td className="py-3 px-3 text-[10px] uppercase">{res.resource_type.replace('_', ' ')}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${getStatusBadge(res.status)}`}>{res.status}</span>
                      </td>
                      <td className="py-3 px-3 text-[10px]">{res.latitude ? `(${res.latitude.toFixed(2)}, ${res.longitude?.toFixed(2)})` : 'CENTRAL DEPOT'}</td>
                      <td className="py-3 px-3 text-adcc-accent font-bold">{res.quantity}</td>
                      <td className="py-3 px-3 text-[10.5px] truncate max-w-[180px]" title={getAllocationLabel(res.id)}>{getAllocationLabel(res.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dispatch Console */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 h-fit">
          <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
              <Truck size={13} className="text-adcc-accent" />
              Manual Dispatch Controller
            </h3>
          </div>

          <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Target Disaster Incident</label>
              <select value={selectedDisasterId} onChange={e => setSelectedDisasterId(e.target.value)} className={inputCls}>
                <option value="">-- SELECT TACTICAL TARGET --</option>
                {disasters.filter(d => d.status === 'Active').map(d => (
                  <option key={d.id} value={d.id}>{d.title.toUpperCase()} ({d.severity})</option>
                ))}
              </select>
            </div>

            {selectedDisasterId && (
              <div className="p-3.5 bg-adcc-accentDim border border-adcc-accentBorder rounded-xl flex flex-col gap-2 font-mono text-[9px]">
                <span className="text-adcc-accent uppercase font-bold flex items-center gap-1.5">
                  <Cpu size={11} className="animate-pulse" /> Autonomous Dispatch AI
                </span>
                <span className="text-adcc-textMuted leading-relaxed">AI evaluates closest reserves, path routing, and deployment reasons.</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button type="button" disabled={isAiLoading} onClick={handleAiRecommend}
                    className="py-2 px-2 border border-adcc-accentBorder hover:border-adcc-accent hover:text-adcc-accent text-adcc-textMuted rounded-lg font-bold uppercase transition-colors">
                    {isAiLoading ? 'Evaluating...' : '🤖 Suggest'}
                  </button>
                  <button type="button" disabled={isAiLoading || dispatchMutation.isPending} onClick={handleAiAutoDispatch}
                    className="py-2 px-2 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-adcc-textPrimary rounded-lg font-bold uppercase transition-colors">
                    {dispatchMutation.isPending ? 'Deploying...' : '🤖 Dispatch'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Select Available Responders</label>
              <select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className={inputCls}>
                <option value="">-- SELECT AVAILABLE EQUIPMENT --</option>
                {resources.filter(r => r.status === 'Available').map(r => (
                  <option key={r.id} value={r.id}>{r.resource_name.toUpperCase()} (Qty: {r.quantity})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Deploy Quantity</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDispatchQty(p => Math.max(1, p - 1))}
                  className="p-2.5 border border-adcc-border rounded-xl hover:bg-adcc-surface2 text-adcc-accent transition-colors">
                  <Minus size={12} />
                </button>
                <input type="number" value={dispatchQty} onChange={e => setDispatchQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center font-mono text-sm py-2 rounded-xl" />
                <button type="button" onClick={() => setDispatchQty(p => p + 1)}
                  className="p-2.5 border border-adcc-border rounded-xl hover:bg-adcc-surface2 text-adcc-accent transition-colors">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Deployment Reason / Notes</label>
              <input type="text" value={dispatchReason} onChange={e => setDispatchReason(e.target.value)}
                placeholder="Tactical reinforcement backup..."
                className="text-[11px] rounded-xl px-3 py-2.5" />
            </div>

            {dispatchError && (
              <div className="flex items-start gap-2 bg-adcc-danger/10 border border-adcc-danger/25 p-3 rounded-xl text-[10px] text-adcc-danger font-mono uppercase">
                <ShieldAlert size={13} className="shrink-0 mt-0.5" /><span>{dispatchError}</span>
              </div>
            )}
            {dispatchSuccess && (
              <div className="flex items-start gap-2 bg-adcc-success/10 border border-adcc-success/25 p-3 rounded-xl text-[10px] text-adcc-success font-mono uppercase">
                <CheckCircle size={13} className="shrink-0 mt-0.5" /><span>RELIEF FORCE DISPATCHED SUCCESSFULLY.</span>
              </div>
            )}

            <button type="submit" disabled={dispatchMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 py-3 mt-1 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200 disabled:opacity-50">
              <Navigation size={13} /> Dispatch Tactical Override
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
};
export default Resources;
