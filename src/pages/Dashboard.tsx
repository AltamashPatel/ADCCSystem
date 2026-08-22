import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  MapPin, 
  Activity, 
  Boxes, 
  BellRing,
  FileDown,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import apiService from '../services/api';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import SystemHealth from '../components/SystemHealth';
import LiveAlertsPanel from '../components/LiveAlertsPanel';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

export const Dashboard: React.FC = () => {
  // 1. Fetch live data from FastAPI backend using React Query
  const { data: disasters = [], isLoading: disastersLoading, refetch: refetchDisasters } = useQuery({
    queryKey: ['disasters'],
    queryFn: apiService.getDisasters
  });

  const { data: resources = [], isLoading: resourcesLoading, refetch: refetchResources } = useQuery({
    queryKey: ['resources'],
    queryFn: apiService.getResources
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: apiService.getAlerts
  });

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: apiService.getHealth
  });

  // Sync Mutation to query GDACS & USGS on the backend
  const syncMutation = useMutation({
    mutationFn: apiService.syncDisasters,
    onSuccess: () => {
      refetchDisasters();
      refetchResources();
      refetchAlerts();
      refetchHealth();
    }
  });

  const handleRefreshAll = () => {
    syncMutation.mutate();
  };

  const isRefreshLoading = disastersLoading || resourcesLoading || alertsLoading || healthLoading || syncMutation.isPending;

  // 2. Compute dynamic stats
  const activeDisasters = disasters.filter(d => d.status === 'Active');
  const criticalDisasters = activeDisasters.filter(d => d.severity === 'Critical' || d.severity === 'High');
  const verifiedReports = disasters.filter(d => d.verification_status === 'Verified');
  
  // Affected Population
  const totalAffectedPop = activeDisasters.reduce((acc, curr) => acc + (curr.affected_population || 0), 0);
  
  // Resource Available
  const totalQty = resources.reduce((acc, curr) => acc + curr.quantity, 0);
  const availableQty = resources.filter(r => r.status === 'Available').reduce((acc, curr) => acc + curr.quantity, 0);
  const resourcePercent = totalQty > 0 ? Math.round((availableQty / totalQty) * 100) : 0;

  // Highest severity level in play
  const getHighestSeverity = () => {
    if (activeDisasters.some(d => d.severity === 'Critical')) return 'Critical';
    if (activeDisasters.some(d => d.severity === 'High' || d.severity === 'Medium')) return 'High';
    return 'Low';
  };
  const currentSeverityLevel = getHighestSeverity();

  // Average confidence score across verified events
  const getAverageConfidence = () => {
    const verifiedWithConf = verifiedReports.filter(d => d.confidence_score !== undefined);
    if (verifiedWithConf.length === 0) return 0;
    const totalConf = verifiedWithConf.reduce((sum, d) => sum + (d.confidence_score || 0), 0);
    return Math.round((totalConf / verifiedWithConf.length) * 100);
  };
  const avgConfidence = getAverageConfidence();

  // 3. Map charts data from DB fields
  const resourceChartData = ['Boat', 'Ambulance', 'Medical_Team', 'Rescue_Team', 'NDRF_Unit'].map(type => {
    const typeResources = resources.filter(r => r.resource_type === type);
    const available = typeResources.filter(r => r.status === 'Available').reduce((sum, r) => sum + r.quantity, 0);
    const busy = typeResources.filter(r => r.status === 'Busy').reduce((sum, r) => sum + r.quantity, 0);
    return {
      name: type.replace('_', ' '),
      Available: available,
      Deployed: busy
    };
  });

  const trendData = [
    { name: 'Jan', Cyclones: 1, Wildfires: 2, Floods: 2 },
    { name: 'Feb', Cyclones: 0, Wildfires: 1, Floods: 3 },
    { name: 'Mar', Cyclones: 2, Wildfires: 1, Floods: 4 },
    { name: 'Apr', Cyclones: 1, Wildfires: 2, Floods: 5 },
    { name: 'May', Cyclones: 2, Wildfires: 3, Floods: 6 },
    { name: 'Jun', 
      Cyclones: activeDisasters.filter(d=>d.disaster_type==='Cyclone').length, 
      Wildfires: activeDisasters.filter(d=>d.disaster_type==='Wildfire').length, 
      Floods: activeDisasters.filter(d=>d.disaster_type==='Flood').length 
    }
  ];

  // Export report dummy handler
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ADCC OPERATIONAL COMMAND REPORT - " + new Date().toISOString() + "\n" +
      "Active Disasters," + activeDisasters.length + "\n" +
      "Verified Reports," + verifiedReports.length + "\n" +
      "Highest Severity Level," + currentSeverityLevel + "\n" +
      "Affected Population," + totalAffectedPop + "\n" +
      "Resource Available %," + resourcePercent + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `adcc_live_command_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Layout Framer Motion animations
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } }
  };

  const isDemoActive = activeDisasters.some(d => d.source === 'DEMO');

  return (
    <PageContainer>
      {isDemoActive && (
        <div className="flex items-center gap-3 px-4 py-3 bg-adcc-warning/8 border border-adcc-warning/25 rounded-2xl text-adcc-warning font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-adcc-warning opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-adcc-warning" />
          </span>
          <span className="font-bold tracking-wider uppercase">Demo Mode Active</span>
          <span className="text-adcc-textMuted border-l border-adcc-border pl-3">Scenario generated for testing and training purposes.</span>
        </div>
      )}
      <SectionHeader 
        title="Emergency Operations Command" 
        description="Real-time live multi-agent pipeline monitoring and dispatch synchronization."
        actions={
          <div className="flex gap-2">
            <button
              disabled={isRefreshLoading}
              onClick={handleRefreshAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw size={11} className={isRefreshLoading ? 'animate-spin' : ''} /> Sync
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-adcc-surface2 border border-adcc-border hover:border-adcc-accentBorder text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200"
            >
              <FileDown size={11} /> Export
            </button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Active Disasters"
            value={activeDisasters.length}
            icon={<ShieldAlert size={20} />}
            trend={`${criticalDisasters.length} Critical`}
            trendDirection={criticalDisasters.length > 0 ? "up" : "neutral"}
            statusText={activeDisasters.length > 0 ? 'ACTIVE HAZARD' : 'NOMINAL'}
            statusType={activeDisasters.length > 0 ? 'danger' : 'success'}
            glow={activeDisasters.length > 0}
            sparklineData={[3, 5, 2, 6, 4, activeDisasters.length]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Verified Reports"
            value={verifiedReports.length}
            icon={<ShieldCheck size={20} className="text-adcc-success" />}
            trend={`${disasters.length - verifiedReports.length} Pending`}
            trendDirection="neutral"
            statusText="CONFIRMED EVENTS"
            statusType="success"
            sparklineData={[6, 8, 7, 9, 8, verifiedReports.length]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Severity Level"
            value={currentSeverityLevel}
            icon={<MapPin size={20} />}
            trend="Max Outbreak"
            trendDirection="neutral"
            statusText="RESPONSE LEVEL"
            statusType={currentSeverityLevel === 'Critical' ? 'danger' : currentSeverityLevel === 'High' ? 'warning' : 'success'}
            glow={currentSeverityLevel === 'Critical'}
            sparklineData={[1, 2, 3, 2, 4, currentSeverityLevel === 'Critical' ? 5 : currentSeverityLevel === 'High' ? 3 : 1]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Confidence Score"
            value={`${avgConfidence}%`}
            icon={<Activity size={20} />}
            trend="Consensus Rating"
            trendDirection="neutral"
            statusText="DATA RELIABILITY"
            statusType={avgConfidence >= 75 ? 'success' : avgConfidence >= 50 ? 'warning' : 'danger'}
            sparklineData={[60, 68, 72, 70, 75, avgConfidence]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Resource Available"
            value={`${resourcePercent}%`}
            icon={<Boxes size={20} />}
            trend={`${availableQty} Units Vacant`}
            trendDirection={resourcePercent < 50 ? "down" : "neutral"}
            statusText="LOGISTICS BUFFER"
            statusType={resourcePercent >= 80 ? 'success' : resourcePercent >= 50 ? 'warning' : 'danger'}
            sparklineData={[80, 85, 78, 70, 74, resourcePercent]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Critical Alerts"
            value={alerts.filter(a => a.severity === 'Critical').length}
            icon={<BellRing size={20} />}
            trend="Live Sensors"
            trendDirection="neutral"
            statusText="ALARM STATUS"
            statusType={alerts.some(a=>a.severity==='Critical') ? 'danger' : 'info'}
            sparklineData={[1, 0, 2, 1, 3, alerts.filter(a => a.severity === 'Critical').length]}
          />
        </motion.div>
      </motion.div>

      {/* Diagnostics Health Status Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative z-10"
      >
        <SystemHealth 
          dbConnected={health?.database === 'connected'} 
          apiConnected={!!health}
          onRefresh={handleRefreshAll}
          isLoading={isRefreshLoading}
        />
      </motion.div>

      {/* Visual Analytics / Main Panels Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
        
        {/* Disaster Inundation Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="xl:col-span-2 tactical-hud-panel rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 font-mono" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-bold text-[11px] tracking-wider uppercase text-adcc-textPrimary">
              Incident Frequency Ingestion (Active Models)
            </h3>
            <span className="text-[9px] text-adcc-accent uppercase font-mono">Live GIS Ingestion</span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCyclones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWildfires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFloods" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111D35', border: '1px solid rgba(0,224,255,0.15)', borderRadius: '12px', color: '#EEF2FF', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Cyclones" stroke="#F43F5E" fillOpacity={1} fill="url(#colorCyclones)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Wildfires" stroke="#F59E0B" fillOpacity={1} fill="url(#colorWildfires)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Floods"   stroke="#00E0FF" fillOpacity={1} fill="url(#colorFloods)"   strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Alerts Panel (Auto-polling backend every 30s) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="h-full"
        >
          <LiveAlertsPanel limit={4} />
        </motion.div>
      </div>

      {/* Second Row: Resource Utilization Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20 relative z-10">
        
        {/* Resource Allocation Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="xl:col-span-2 tactical-hud-panel rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 font-mono" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-bold text-[11px] tracking-wider uppercase text-adcc-textPrimary">
              Resource Distribution Telemetry (Database Sync)
            </h3>
            <span className="text-[9px] text-adcc-accent uppercase font-mono">Logistics Depot Logs</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111D35', border: '1px solid rgba(0,224,255,0.15)', borderRadius: '12px', color: '#EEF2FF', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', paddingTop: '10px' }} />
                <Bar dataKey="Available" fill="#00E0FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deployed"  fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tactical Status Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="tactical-hud-panel rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 font-mono" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-bold text-[11px] tracking-wider uppercase text-adcc-textPrimary">
              Logistics Registry Summary
            </h3>
            <span className="text-[9px] text-adcc-success uppercase font-mono">Active Sync</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-2.5 font-mono text-[11px]">
            {[
              { label: 'GIS Ingestion Server',  value: '99.98% UPTIME',    color: 'text-adcc-success' },
              { label: 'Heartbeat Frequency',   value: '1.0s (POLLING)',   color: 'text-adcc-accent'  },
              { label: 'Satellite Latency',     value: '480ms (SAT-NET)',  color: 'text-adcc-warning' },
              { label: 'Primary Data Center',   value: 'MUMBAI-CENTRAL',  color: 'text-adcc-success' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center bg-adcc-surface2/60 border border-adcc-border px-3 py-2.5 rounded-xl">
                <span className="text-adcc-textMuted uppercase text-[10px]">{label}</span>
                <span className={`font-bold text-[10px] ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating HUD Command Action Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-adcc-surface/90 backdrop-blur-xl border border-adcc-accentBorder px-4 py-3 rounded-2xl z-[1000] flex flex-col md:flex-row items-center gap-4 shadow-elevated w-[90%] max-w-[660px]">
        <div className="relative w-full md:w-44 flex items-center">
          <input
            type="text"
            placeholder="Cmd + K Command Search..."
            className="text-[10px] font-mono pl-7 pr-2.5 py-1.5 w-full rounded-lg bg-adcc-surface2 border border-adcc-border focus:border-adcc-accent"
          />
          <span className="absolute left-2 text-[10px] text-adcc-textMuted font-mono">⌘</span>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => alert("Simulating Twilio alert broadcast pipeline dispatch.")}
            className="px-2.5 py-1.5 bg-adcc-danger/15 hover:bg-adcc-danger hover:text-white border border-adcc-danger/30 rounded-lg text-[9px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
          >
            Trigger Evac
          </button>
          <button
            onClick={() => alert("Mobilizing tactical rescue resource batches.")}
            className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-adcc-bg border border-amber-500/30 rounded-lg text-[9px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
          >
            Deploy Resource
          </button>
          <button
            onClick={() => alert("Calculating alternative safe routing corridors.")}
            className="px-2.5 py-1.5 bg-adcc-accentDim hover:bg-adcc-accent hover:text-adcc-bg border border-adcc-accentBorder rounded-lg text-[9px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
          >
            Calculate Route
          </button>
        </div>
      </div>

    </PageContainer>
  );
};
export default Dashboard;
