import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  Flame, 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  FileDown, 
  Search,
  Filter,
  Globe,
  Radio
} from 'lucide-react';
import apiService, { BackendDisaster } from '../services/api';
import PageContainer from '../components/PageContainer';
import DisasterBentoCard from '../components/DisasterBentoCard';
import IncidentDetailModal from '../components/IncidentDetailModal';

export const Dashboard: React.FC = () => {
  const [selectedDisaster, setSelectedDisaster] = useState<BackendDisaster | null>(null);
  const [regionFilter, setRegionFilter] = useState<'all' | 'USA' | 'India'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch live disaster data from FastAPI backend
  const { 
    data: disasters = [], 
    isLoading: disastersLoading, 
    refetch: refetchDisasters 
  } = useQuery({
    queryKey: ['disasters'],
    queryFn: apiService.getDisasters
  });

  // 2. Sync Mutation to trigger live GDACS & NOAA NWS updates
  const syncMutation = useMutation({
    mutationFn: apiService.syncDisasters,
    onSuccess: () => {
      refetchDisasters();
    }
  });

  const handleRefreshAll = () => {
    syncMutation.mutate();
  };

  // 3. Compute High-Level Metrics
  const activeDisasters = disasters.filter(d => d.status === 'Active' || !d.status);
  const criticalDisasters = disasters.filter(d => d.severity === 'Critical' || d.severity === 'High');
  const verifiedReports = disasters.filter(d => d.verification_status === 'Verified');
  const totalAffectedPop = disasters.reduce((acc, curr) => acc + (curr.affected_population || 0), 0);

  // 4. Region & Filter matching
  const filteredDisasters = disasters.filter(d => {
    // Region filter
    const isUsa = d.country?.toUpperCase() === 'USA' || (d.longitude !== undefined && d.longitude < -30);
    const isIndia = d.country?.toUpperCase() === 'INDIA' || (d.longitude !== undefined && d.longitude > 60 && d.longitude < 100);

    let matchesRegion = true;
    if (regionFilter === 'USA') matchesRegion = isUsa;
    if (regionFilter === 'India') matchesRegion = isIndia;

    // Severity filter
    const matchesSeverity = severityFilter === 'all' || d.severity.toLowerCase() === severityFilter.toLowerCase();

    // Search filter
    const matchesSearch = searchQuery === '' || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.disaster_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.source && d.source.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRegion && matchesSeverity && matchesSearch;
  });

  // 5. Export Report
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ADCC DISASTER SITUATION REPORT - " + new Date().toISOString() + "\n" +
      "Total Active Disasters," + activeDisasters.length + "\n" +
      "Critical Severity Outbreaks," + criticalDisasters.length + "\n" +
      "Verified Events," + verifiedReports.length + "\n" +
      "Total Affected Population," + totalAffectedPop + "\n\n" +
      "Title,Type,Severity,Country,Affected Population,Verification Status,Coordinates\n" +
      disasters.map(d => `"${d.title}","${d.disaster_type}","${d.severity}","${d.country || 'N/A'}",${d.affected_population || 0},"${d.verification_status}","${d.latitude},${d.longitude}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `adcc_disaster_situation_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Disaster Situation Command
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Radio size={14} className="animate-pulse text-cyan-400" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-400 mt-1 font-normal">
            Real-time situational awareness across all active global and domestic hazard perimeters.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-3">
          <button
            disabled={syncMutation.isPending || disastersLoading}
            onClick={handleRefreshAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg"
          >
            <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
            <span>{syncMutation.isPending ? 'Syncing Feeds...' : 'Sync Live NWS / GDACS'}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-white/10 transition-all duration-200 cursor-pointer"
          >
            <FileDown size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* High-Level Situational Overview Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs sm:text-sm uppercase font-bold text-slate-400 tracking-wider">
              Total Active Disasters
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {activeDisasters.length}
            </div>
            <span className="text-xs text-slate-500 font-medium">Monitored In Real-Time</span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldAlert size={28} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs sm:text-sm uppercase font-bold text-rose-300 tracking-wider">
              Critical Outbreaks
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
              {criticalDisasters.length}
            </div>
            <span className="text-xs text-rose-400/70 font-medium">Immediate Response Active</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Flame size={28} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs sm:text-sm uppercase font-bold text-amber-300 tracking-wider">
              Citizens At Risk
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {totalAffectedPop ? totalAffectedPop.toLocaleString() : 'Estimating'}
            </div>
            <span className="text-xs text-amber-400/70 font-medium">In Evacuation Perimeters</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Users size={28} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs sm:text-sm uppercase font-bold text-emerald-300 tracking-wider">
              Verified Events
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {verifiedReports.length}
            </div>
            <span className="text-xs text-emerald-400/70 font-medium">Satellite & Ground Confirmed</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={28} />
          </div>
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-lg">
        {/* Country Focus Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mr-1 shrink-0">
            <Globe size={16} className="text-cyan-400" />
            Region:
          </span>
          {[
            { id: 'all', label: 'All Global Disasters' },
            { id: 'USA', label: '🇺🇸 United States' },
            { id: 'India', label: '🇮🇳 India' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRegionFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                regionFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Severity Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Severity Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs sm:text-sm font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Severity Levels</option>
              <option value="critical">🔴 Critical Severity</option>
              <option value="high">🟠 High Severity</option>
              <option value="medium">🟡 Medium Severity</option>
              <option value="low">🟢 Low Severity</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search disaster name or city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      {disastersLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
          <RefreshCw size={36} className="animate-spin text-cyan-400" />
          <p className="text-base sm:text-lg font-bold">Synchronizing active disaster telemetry feeds...</p>
        </div>
      ) : filteredDisasters.length === 0 ? (
        <div className="py-20 bg-slate-900/60 border border-dashed border-white/15 rounded-3xl flex flex-col items-center justify-center text-center p-6 gap-3">
          <ShieldAlert size={44} className="text-slate-500" />
          <h3 className="text-lg sm:text-xl font-bold text-white">No Disasters Match Selected Filters</h3>
          <p className="text-sm sm:text-base text-slate-400 max-w-md">
            Try switching region tabs or clearing search keywords to view all active emergency events.
          </p>
          <button
            onClick={() => {
              setRegionFilter('all');
              setSeverityFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 auto-rows-auto">
          {filteredDisasters.map((disaster, idx) => (
            <DisasterBentoCard
              key={disaster.id}
              disaster={disaster}
              onClick={setSelectedDisaster}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Detailed Incident View Modal */}
      <IncidentDetailModal 
        disaster={selectedDisaster} 
        onClose={() => setSelectedDisaster(null)} 
      />
    </PageContainer>
  );
};

export default Dashboard;
