import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { BackendAllocation } from '../services/api';
import { 
  Bot, 
  Ambulance, 
  Users, 
  Ship, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  Send, 
  FileWarning, 
  X,
  Radio,
  ShieldAlert
} from 'lucide-react';

interface HumanVerificationTableProps {
  limit?: number;
  filterDisasterId?: string;
}

export const HumanVerificationTable: React.FC<HumanVerificationTableProps> = ({ 
  limit = 100,
  filterDisasterId
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'DISPATCHED' | 'REACHED' | 'ISSUE'>('ALL');
  
  // Issue Modal State
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<BackendAllocation | null>(null);
  const [selectedIssueCategory, setSelectedIssueCategory] = useState('Severe Weather Hazard / High Winds');
  const [issueNotes, setIssueNotes] = useState('');
  const [verifierName, setVerifierName] = useState('Dispatcher Alpha-1');

  // Fetch Allocations
  const { data: allocations = [], isLoading } = useQuery<BackendAllocation[]>({
    queryKey: ['allocations', filterDisasterId],
    queryFn: () => apiService.getAllocations(filterDisasterId),
    refetchInterval: 5000 // Real-time poll every 5s
  });

  // Verify Allocation Mutation
  const verifyMutation = useMutation({
    mutationFn: (variables: { id: string; status: string; field_status_notes?: string; issue_description?: string; human_verified_by?: string }) => {
      return apiService.verifyAllocation(variables.id, {
        status: variables.status,
        human_verified_by: variables.human_verified_by || verifierName,
        field_status_notes: variables.field_status_notes,
        issue_description: variables.issue_description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIssueModalOpen(false);
      setSelectedAllocation(null);
      setIssueNotes('');
    }
  });

  const handleApprove = (alloc: BackendAllocation) => {
    verifyMutation.mutate({
      id: alloc.id,
      status: 'Dispatched',
      human_verified_by: verifierName,
      field_status_notes: 'Human operator authorized dispatch. Responder units mobilized.'
    });
  };

  const handleConfirmReached = (alloc: BackendAllocation) => {
    verifyMutation.mutate({
      id: alloc.id,
      status: 'Reached',
      human_verified_by: verifierName,
      field_status_notes: 'Field confirmation received: Responder arrived on-scene and operational.'
    });
  };

  const handleOpenIssueModal = (alloc: BackendAllocation) => {
    setSelectedAllocation(alloc);
    setIssueNotes(alloc.issue_description || '');
    setIssueModalOpen(true);
  };

  const handleComplete = (alloc: BackendAllocation) => {
    verifyMutation.mutate({
      id: alloc.id,
      status: 'Completed',
      human_verified_by: verifierName,
      field_status_notes: 'Emergency mission completed. Resource returned to depot reserves.'
    });
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;

    verifyMutation.mutate({
      id: selectedAllocation.id,
      status: 'Issue Reported',
      human_verified_by: verifierName,
      issue_description: `${selectedIssueCategory}: ${issueNotes}`,
      field_status_notes: `Impediment logged by ${verifierName}: ${selectedIssueCategory}`
    });
  };

  // Filter allocations
  const filtered = allocations.filter(a => {
    if (activeTab === 'PENDING') return a.status === 'Pending Approval';
    if (activeTab === 'DISPATCHED') return a.status === 'Dispatched' || a.status === 'En Route';
    if (activeTab === 'REACHED') return a.status === 'Reached';
    if (activeTab === 'ISSUE') return a.status === 'Issue Reported';
    return true;
  }).slice(0, limit);

  const getResourceIcon = (type?: string, name?: string) => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();

    if (t.includes('robot') || n.includes('spot') || n.includes('thermite') || n.includes('drone') || n.includes('skydio') || n.includes('kobra') || n.includes('rov')) {
      return <Bot className="text-cyan-400" size={15} />;
    }
    if (t.includes('ambulance') || n.includes('ambulance')) {
      return <Ambulance className="text-amber-400" size={15} />;
    }
    if (t.includes('evacuation') || n.includes('evacuation') || t.includes('ndrf')) {
      return <Users className="text-emerald-400" size={15} />;
    }
    if (t.includes('boat') || n.includes('boat')) {
      return <Ship className="text-sky-400" size={15} />;
    }
    return <HeartPulse className="text-purple-400" size={15} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock size={11} /> PENDING APPROVAL
          </span>
        );
      case 'Dispatched':
      case 'En Route':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Send size={11} className="animate-pulse" /> DISPATCHED
          </span>
        );
      case 'Reached':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={11} /> ON-SITE REACHED
          </span>
        );
      case 'Issue Reported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse">
            <AlertTriangle size={11} /> ISSUE REPORTED
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-500/10 text-gray-400 border border-gray-500/30">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel border border-gray-800 rounded-xl p-5 flex flex-col gap-4 bg-[#090E1A]/80 shadow-2xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-850 pb-4">
        <div>
          <h3 className="font-bold text-sm font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-2">
            <Radio size={16} className="text-adcc-accent animate-pulse" />
            Live Resource Allocation & Human Verification Ledger
          </h3>
          <p className="text-[11px] text-adcc-textMuted font-sans mt-0.5">
            Real-time responder telemetry, operator contact links, and two-stage field status verification.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-adcc-secondary/40 border border-gray-850 rounded-lg text-[10px] font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'ALL' ? 'bg-adcc-accent text-adcc-bg font-bold' : 'text-adcc-textMuted hover:text-adcc-textPrimary'}`}
          >
            All ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'PENDING' ? 'bg-amber-500 text-adcc-bg font-bold' : 'text-amber-400 hover:text-amber-300'}`}
          >
            Pending ({allocations.filter(a => a.status === 'Pending Approval').length})
          </button>
          <button
            onClick={() => setActiveTab('DISPATCHED')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'DISPATCHED' ? 'bg-blue-500 text-adcc-bg font-bold' : 'text-blue-400 hover:text-blue-300'}`}
          >
            En Route ({allocations.filter(a => a.status === 'Dispatched' || a.status === 'En Route').length})
          </button>
          <button
            onClick={() => setActiveTab('REACHED')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'REACHED' ? 'bg-emerald-500 text-adcc-bg font-bold' : 'text-emerald-400 hover:text-emerald-300'}`}
          >
            Reached ({allocations.filter(a => a.status === 'Reached').length})
          </button>
          <button
            onClick={() => setActiveTab('ISSUE')}
            className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'ISSUE' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-300'}`}
          >
            Issues ({allocations.filter(a => a.status === 'Issue Reported').length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[11px] text-adcc-textMuted border-collapse">
          <thead>
            <tr className="border-b border-gray-850 text-adcc-textPrimary bg-adcc-secondary/40 text-[9px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Disaster Incident</th>
              <th className="py-2.5 px-3">Allocated Resource & Model</th>
              <th className="py-2.5 px-3">In-Charge & Phone</th>
              <th className="py-2.5 px-3">Distance & Route</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Human Verification Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-adcc-accent animate-pulse font-mono">
                  SYNCING TACTICAL VERIFICATION REGISTRY...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-adcc-textMuted font-mono">
                  NO ALLOCATIONS FOUND IN THIS VIEW
                </td>
              </tr>
            ) : (
              filtered.map((alloc) => {
                const isUS = alloc.disaster_country === 'USA' || (alloc.contact_phone && alloc.contact_phone.startsWith('+1'));
                const distanceMiles = alloc.distance_km ? (alloc.distance_km * 0.621371).toFixed(1) : null;

                return (
                  <tr 
                    key={alloc.id} 
                    className={`hover:bg-adcc-secondary/20 transition-colors ${alloc.status === 'Issue Reported' ? 'bg-rose-500/5' : ''}`}
                  >
                    {/* Disaster Title & Country */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0" title={isUS ? 'United States' : 'India'}>
                          {isUS ? '🇺🇸' : '🇮🇳'}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-adcc-textPrimary truncate" title={alloc.disaster_title || 'Disaster'}>
                            {alloc.disaster_title || 'Active Incident'}
                          </span>
                          <span className="text-[9px] text-adcc-accent flex items-center gap-1">
                            {alloc.disaster_type} • {alloc.disaster_severity}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Resource Name, Spec & Qty */}
                    <td className="py-3 px-3 max-w-[230px]">
                      <div className="flex items-start gap-2">
                        <div className="p-1 rounded bg-adcc-secondary/60 border border-gray-800 shrink-0 mt-0.5">
                          {getResourceIcon(alloc.resource_type, alloc.resource_name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-adcc-textPrimary text-[11.5px]">
                            {alloc.resource_name || 'Emergency Unit'}
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[8.5px] bg-adcc-accent/15 text-adcc-accent border border-adcc-accent/30 font-mono">
                              Qty: {alloc.quantity}
                            </span>
                          </span>
                          <span className="text-[9.5px] text-cyan-300/80 truncate" title={alloc.resource_model || alloc.resource_type}>
                            {alloc.resource_model || alloc.resource_type || 'Standard Equipment'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Operator & Phone Contact */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-adcc-textPrimary font-semibold text-[10.5px]">
                          {alloc.contact_name || 'Officer In-Charge'}
                        </span>
                        {alloc.contact_phone ? (
                          <a 
                            href={`tel:${alloc.contact_phone}`}
                            className="text-[10px] text-adcc-accent hover:underline flex items-center gap-1 font-mono tracking-tight"
                            title="Call responder phone"
                          >
                            <Phone size={10} className="shrink-0" />
                            {alloc.contact_phone}
                          </a>
                        ) : (
                          <span className="text-[9px] text-adcc-textMuted">Radio Link 156.8 MHz</span>
                        )}
                      </div>
                    </td>

                    {/* Distance & Route */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-adcc-textPrimary font-bold flex items-center gap-1 text-[10.5px]">
                          <MapPin size={10} className="text-adcc-danger shrink-0" />
                          {alloc.distance_km ? `${alloc.distance_km} km` : '12.5 km'}
                          {distanceMiles && <span className="text-[9px] text-adcc-textMuted font-normal">({distanceMiles} mi)</span>}
                          {alloc.eta_minutes !== undefined && (
                            <span className="text-[9px] text-amber-400 font-normal ml-1">
                              • ETA ~{alloc.eta_minutes}m
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-adcc-textMuted truncate" title={alloc.route_name || 'Designated Corridor'}>
                          {alloc.route_name || 'Assigned Corridor'}
                        </span>
                      </div>
                    </td>

                    {/* Status & Issue Preview */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(alloc.status)}
                        {alloc.status === 'Issue Reported' && alloc.issue_description && (
                          <div className="text-[9px] text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-800/60 max-w-[190px] leading-tight font-sans">
                            <span className="font-bold font-mono uppercase text-[8px] text-rose-400 block">⚠️ Impediment:</span>
                            {alloc.issue_description}
                          </div>
                        )}
                        {alloc.human_verified_by && (
                          <span className="text-[8px] text-gray-500">
                            By {alloc.human_verified_by}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Interactive Verification Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alloc.status === 'Pending Approval' && (
                          <button
                            onClick={() => handleApprove(alloc)}
                            disabled={verifyMutation.isPending}
                            className="py-1 px-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-adcc-bg text-emerald-300 rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title="Approve allocation and mobilize responder"
                          >
                            <CheckCircle2 size={11} /> Approve & Dispatch
                          </button>
                        )}

                        {(alloc.status === 'Dispatched' || alloc.status === 'En Route' || alloc.status === 'Active') && (
                          <>
                            <button
                              onClick={() => handleConfirmReached(alloc)}
                              disabled={verifyMutation.isPending}
                              className="py-1 px-2 bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500 hover:text-adcc-bg text-emerald-300 rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              title="Confirm resource arrived on scene"
                            >
                              <CheckCircle2 size={11} /> Reached
                            </button>
                            <button
                              onClick={() => handleOpenIssueModal(alloc)}
                              disabled={verifyMutation.isPending}
                              className="py-1 px-2 bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-rose-300 rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              title="Report weather hazard or road roadblock"
                            >
                              <FileWarning size={11} /> Report Issue
                            </button>
                          </>
                        )}

                        {alloc.status === 'Issue Reported' && (
                          <>
                            <button
                              onClick={() => handleConfirmReached(alloc)}
                              disabled={verifyMutation.isPending}
                              className="py-1 px-2 bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500 hover:text-adcc-bg text-emerald-300 rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={11} /> Reached
                            </button>
                            <button
                              onClick={() => handleOpenIssueModal(alloc)}
                              className="py-1 px-2 bg-rose-500/25 border border-rose-500/50 text-rose-200 rounded text-[9.5px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Update Issue
                            </button>
                          </>
                        )}

                        {alloc.status === 'Reached' && (
                          <button
                            onClick={() => handleComplete(alloc)}
                            disabled={verifyMutation.isPending}
                            className="py-1 px-2 bg-adcc-secondary border border-gray-700 hover:border-gray-500 text-adcc-textPrimary rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title="Complete incident mission and release unit"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Report Issue Modal */}
      {issueModalOpen && selectedAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel bg-[#0B132B] border border-rose-500/40 rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-[0_0_30px_rgba(244,63,94,0.15)] font-mono">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                <ShieldAlert size={16} /> Report Field Issue & Delay
              </div>
              <button 
                onClick={() => setIssueModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="flex flex-col gap-3 text-xs">
              <div className="p-2.5 bg-adcc-secondary/40 border border-gray-800 rounded flex flex-col gap-1">
                <span className="text-[10px] text-adcc-textMuted uppercase">Responding Unit:</span>
                <span className="font-bold text-adcc-textPrimary text-sm">
                  {selectedAllocation.resource_name} ({selectedAllocation.resource_model || selectedAllocation.resource_type})
                </span>
                <span className="text-[10px] text-adcc-accent">
                  Target: {selectedAllocation.disaster_title}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-adcc-textMuted uppercase font-semibold">
                  Impediment Category:
                </label>
                <select
                  value={selectedIssueCategory}
                  onChange={(e) => setSelectedIssueCategory(e.target.value)}
                  className="bg-adcc-bg border border-gray-800 text-adcc-textPrimary rounded p-2 text-xs outline-none focus:border-rose-500"
                >
                  <option value="Severe Weather Hazard / High Winds">🌪️ Severe Weather Hazard / High Winds</option>
                  <option value="Road Inundation / Highway Submerged">🌊 Road Inundation / Highway Submerged</option>
                  <option value="Structural Rubble / Impassable Corridor">🏚️ Structural Rubble / Impassable Corridor</option>
                  <option value="Robotics Hardware / Battery Telemetry Loss">🤖 Robotics Hardware / Sensor Fault</option>
                  <option value="Casualty Surge / Reinforcements Required">🚑 Casualty Surge / Reinforcements Needed</option>
                  <option value="Rerouted via Alternate Highway">🛣️ Rerouted via Alternate Highway</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-adcc-textMuted uppercase font-semibold">
                  Field Details & Responder Observations:
                </label>
                <textarea
                  rows={3}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Crosswinds exceeding 65 mph. Skydio thermal drone grounded until gusts decrease..."
                  className="bg-adcc-bg border border-gray-800 text-adcc-textPrimary rounded p-2.5 text-xs outline-none focus:border-rose-500 font-sans"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-adcc-textMuted uppercase font-semibold">
                  Human Dispatcher / Verifier Callsign:
                </label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="bg-adcc-bg border border-gray-800 text-adcc-textPrimary rounded p-2 text-xs outline-none focus:border-adcc-accent font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-3 py-1.5 bg-adcc-secondary border border-gray-800 hover:border-gray-700 text-adcc-textMuted rounded uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded uppercase text-[10px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <AlertTriangle size={12} /> Log Field Impediment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanVerificationTable;
