import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiService, { SimulationRunRequest, SimulationRunResult, BackendDisaster } from '../services/api';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import {
  Play, Settings, ShieldAlert, Activity, Compass,
  RefreshCw, AlertTriangle, HeartPulse, Boxes,
  Warehouse, Terminal, ArrowRight
} from 'lucide-react';


const severityBadge = (s: string) => {
  switch (s.toLowerCase()) {
    case 'critical': return 'bg-adcc-danger  text-white border-adcc-danger/30';
    case 'high':     return 'bg-[#F97316]    text-white border-[#F97316]/30';
    case 'medium':   return 'bg-adcc-warning text-adcc-bg border-adcc-warning/30';
    default:         return 'bg-adcc-success text-white border-adcc-success/30';
  }
};

const SliderRow: React.FC<{
  label: string; value: number; min?: number; max?: number; step?: number;
  disabled: boolean; onChange: (v: number) => void;
}> = ({ label, value, min = -100, max = 100, step = 5, disabled, onChange }) => (
  <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <div className="flex justify-between text-[10px] font-mono font-bold">
      <span className="text-adcc-textMuted uppercase">{label}</span>
      <span className="text-adcc-accent">{value > 0 ? `+${value}%` : `${value}%`}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full" />
  </div>
);

export const Simulation: React.FC = () => {
  const { data: disasters = [], isLoading: disastersLoading } = useQuery<BackendDisaster[]>({
    queryKey: ['disasters'], queryFn: apiService.getDisasters
  });

  const [simulationType, setSimulationType] = useState<'Flood' | 'Cyclone' | 'Earthquake'>('Flood');
  const [selectedDisasterId, setSelectedDisasterId] = useState('');
  const [rainfallChangePct,           setRainfallChangePct]           = useState(30);
  const [windSpeedChangePct,           setWindSpeedChangePct]           = useState(15);
  const [populationChangePct,          setPopulationChangePct]          = useState(20);
  const [shelterCapacityChangePct,     setShelterCapacityChangePct]     = useState(-10);
  const [resourceAvailabilityChangePct,setResourceAvailabilityChangePct] = useState(-20);
  const [outcomeReport, setOutcomeReport] = useState<SimulationRunResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);

  const steps = [
    { title: 'Ingesting Spatial Layer',      detail: 'Fetching terrain heights and routing networks...' },
    { title: 'Tuning Meteorology',           detail: 'Adjusting atmospheric wind grids and storm surge projections...' },
    { title: 'Simulating Logistics Stress',  detail: 'Applying capacity multiplier constraints to shelter networks...' },
    { title: 'Compiling Digital Twin State', detail: 'Finalizing agent heuristic matrices and risk curves...' },
  ];

  const simulateMutation = useMutation({
    mutationFn: (p: SimulationRunRequest) => apiService.runSimulation(p),
    onSuccess: data => {
      setOutcomeReport(data);
      setLogs(prev => [`[SUCCESS] Digital Twin completed. Scenario: "${data.scenario_name}"`, ...prev]);
      setStepIndex(steps.length);
    },
    onError: (err: any) => {
      setLogs(prev => [`[ERROR] Model crashed: ${err.message}`, ...prev]);
      setStepIndex(-1);
    },
  });

  const isRunning = simulateMutation.isPending || (stepIndex >= 0 && stepIndex < steps.length);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setOutcomeReport(null);
    setStepIndex(0);
    setLogs(['[SYSTEM] Initializing Digital Twin simulation kernel...']);
    let cur = 0;
    const iv = setInterval(() => {
      cur++;
      if (cur < steps.length) {
        setStepIndex(cur);
        setLogs(prev => [
          `[OK] ${steps[cur - 1].title} completed.`,
          `[RUNNING] ${steps[cur].title}... ${steps[cur].detail}`,
          ...prev,
        ]);
      } else {
        clearInterval(iv);
        simulateMutation.mutate({
          simulation_type: simulationType,
          rainfall_change_pct: rainfallChangePct,
          wind_speed_change_pct: windSpeedChangePct,
          population_change_pct: populationChangePct,
          shelter_capacity_change_pct: shelterCapacityChangePct,
          resource_availability_change_pct: resourceAvailabilityChangePct,
          disaster_id: selectedDisasterId || undefined,
        });
      }
    }, 1000);
  };

  const activeDisasters = disasters.filter(d => d.status === 'Active');
  const selectCls = "w-full text-[11px] font-mono rounded-xl px-3 py-2.5";
  const labelCls  = "text-[10px] font-mono uppercase font-semibold text-adcc-textMuted";

  return (
    <PageContainer>
      <SectionHeader
        title="Digital Twin Simulation Console"
        description="Trigger predictive natural hazard scenarios, adjust environmental variables, and analyze resource stress indicators."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Configurator ─────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 h-fit">
          <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
              <Settings size={13} className="text-adcc-accent" /> What-If Configurator
            </h3>
          </div>

          <form onSubmit={handleStart} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Simulated Disaster Type</label>
              <select value={simulationType} onChange={e => setSimulationType(e.target.value as any)} disabled={isRunning} className={selectCls}>
                <option value="Flood">FLOOD INCIDENT</option>
                <option value="Cyclone">CYCLONE / HURRICANE SURGE</option>
                <option value="Earthquake">EARTHQUAKE FAULT SHIFT</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Baseline Disaster Target</label>
              <select value={selectedDisasterId} onChange={e => setSelectedDisasterId(e.target.value)} disabled={disastersLoading || isRunning} className={selectCls}>
                <option value="">-- DEFAULT PRESETS (CITY GRID) --</option>
                {activeDisasters.filter(d => d.disaster_type === simulationType).map(d => (
                  <option key={d.id} value={d.id}>{d.title.toUpperCase()} ({d.severity})</option>
                ))}
              </select>
            </div>

            {simulationType !== 'Earthquake' && (
              <SliderRow label="Rainfall Delta" value={rainfallChangePct} disabled={isRunning} onChange={setRainfallChangePct} />
            )}
            <SliderRow
              label={simulationType === 'Earthquake' ? 'Seismic Energy Intensity' : 'Wind Speed Delta'}
              value={windSpeedChangePct} disabled={isRunning} onChange={setWindSpeedChangePct}
            />
            <SliderRow label="Population Density Delta"    value={populationChangePct}           disabled={isRunning} onChange={setPopulationChangePct} />
            <SliderRow label="Depot Resources Available"   value={resourceAvailabilityChangePct} disabled={isRunning} onChange={setResourceAvailabilityChangePct} />
            <SliderRow label="Shelter Capacity Coefficient" value={shelterCapacityChangePct}      disabled={isRunning} onChange={setShelterCapacityChangePct} />

            <button type="submit" disabled={isRunning}
              className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 bg-adcc-warning/10 border border-adcc-warning/30 hover:bg-adcc-warning hover:text-adcc-bg text-[11px] font-mono font-bold uppercase rounded-xl transition-all duration-200 disabled:opacity-40">
              {isRunning
                ? <RefreshCw size={13} className="animate-spin text-adcc-warning" />
                : <Play size={13} fill="currentColor" />}
              Initialize Digital Twin Model
            </button>
          </form>
        </div>

        {/* ── Right: Output ──────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Terminal */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(8,13,24,0.85)' }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
                <Terminal size={13} className="text-adcc-warning" /> Scenario Analytics Pipeline Logs
              </h3>
              {stepIndex >= 0 && stepIndex < steps.length && (
                <span className="text-[10px] font-mono text-adcc-warning animate-pulse">SOLVING EQUATIONS...</span>
              )}
            </div>

            {stepIndex >= 0 && stepIndex < steps.length && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {steps.map((s, i) => (
                  <div key={i} className={`flex flex-col gap-1 p-2.5 rounded-xl border font-mono text-[9px] transition-all duration-300 ${
                    stepIndex >= i
                      ? 'border-adcc-accentBorder bg-adcc-accentDim text-adcc-accent'
                      : 'border-adcc-border bg-transparent text-adcc-textMuted/30'
                  }`}>
                    <span className="font-bold">STAGE 0{i + 1}</span>
                    <span className="truncate">{s.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-32 rounded-xl border border-adcc-border p-3 font-mono text-[10.5px] leading-relaxed text-adcc-warning overflow-y-auto flex flex-col-reverse gap-1 select-text"
              style={{ background: 'rgba(5,8,17,0.9)' }}>
              {logs.length === 0
                ? <div className="flex items-center justify-center h-full text-[11px] text-adcc-textMuted uppercase tracking-wider">Twin Simulator Offline. Load configuration to boot.</div>
                : logs.map((l, i) => <div key={i} className="pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{l}</div>)
              }
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {outcomeReport && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="flex flex-col gap-5">

                {/* Comparison cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  {[
                    {
                      label: 'Severity Level',
                      before: <span className="text-xs font-bold text-adcc-textPrimary">{outcomeReport.summary.baseline.severity}</span>,
                      after:  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${severityBadge(outcomeReport.summary.predicted.severity_level)}`}>{outcomeReport.summary.predicted.severity_level}</span>,
                    },
                    {
                      label: 'Total Risk Score',
                      before: <span className="text-sm font-bold text-adcc-textPrimary">{outcomeReport.summary.baseline.severity === 'Critical' ? '82.5%' : outcomeReport.summary.baseline.severity === 'High' ? '64.0%' : outcomeReport.summary.baseline.severity === 'Medium' ? '38.0%' : '14.5%'}</span>,
                      after:  <span className="text-sm font-bold text-adcc-accent">{outcomeReport.summary.predicted.severity_score}%</span>,
                    },
                    {
                      label: 'Population Impact',
                      before: <span className="text-xs font-bold text-adcc-textPrimary">{outcomeReport.summary.baseline.affected_population.toLocaleString()}</span>,
                      after:  <span className="text-xs font-bold text-adcc-warning">{outcomeReport.summary.predicted.affected_population.toLocaleString()}</span>,
                    },
                  ].map(({ label, before, after }) => (
                    <div key={label} className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-[9px] text-adcc-textMuted uppercase font-bold">{label}</span>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5"><span className="text-[8px] text-adcc-textMuted uppercase">Baseline</span>{before}</div>
                        <ArrowRight size={13} className="text-adcc-accent" />
                        <div className="flex flex-col gap-0.5 items-end"><span className="text-[8px] text-adcc-textMuted uppercase">Simulated</span>{after}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resource gaps + Shelter overflow */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                    <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
                        <Boxes size={13} className="text-adcc-accent" /> Simulated Logistics Gaps
                      </h3>
                    </div>
                    <div className="space-y-2.5 font-mono text-[10.5px]">
                      {Object.keys(outcomeReport.summary.resource_metrics.required).length === 0 ? (
                        <div className="p-3 border border-dashed border-adcc-border text-center text-adcc-textMuted rounded-xl">NO RESOURCE DEFICITS IDENTIFIED</div>
                      ) : Object.keys(outcomeReport.summary.resource_metrics.required).map(name => {
                        const req   = outcomeReport.summary.resource_metrics.required[name];
                        const avail = outcomeReport.summary.resource_metrics.simulated_available[name];
                        const gap   = outcomeReport.summary.resource_metrics.gap[name];
                        const cov   = req > 0 ? Math.round((Math.max(0, req - gap) / req) * 100) : 100;
                        return (
                          <div key={name} className="p-3 border border-adcc-border rounded-xl bg-adcc-surface2/40 flex flex-col gap-2">
                            <div className="flex justify-between items-center font-bold text-adcc-textPrimary">
                              <span className="flex items-center gap-1.5 uppercase">
                                {name === 'Boat' ? <Compass size={11} className="text-[#38BDF8]" /> : name === 'Ambulance' ? <HeartPulse size={11} className="text-adcc-warning" /> : <Boxes size={11} className="text-adcc-success" />}
                                {name}
                              </span>
                              {gap > 0
                                ? <span className="text-adcc-danger text-[9px] font-bold border border-adcc-danger/25 bg-adcc-danger/8 px-2 py-0.5 rounded-full animate-pulse">DEFICIT: {gap}</span>
                                : <span className="text-adcc-success text-[9px] font-bold border border-adcc-success/25 bg-adcc-success/8 px-2 py-0.5 rounded-full">ADEQUATE</span>
                              }
                            </div>
                            <div className="flex justify-between text-[9px] text-adcc-textMuted">
                              <span>Required: {req}</span><span>Available: {avail}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className={`h-full transition-all duration-500 rounded-full ${cov >= 80 ? 'bg-adcc-success' : cov >= 50 ? 'bg-adcc-warning' : 'bg-adcc-danger'}`} style={{ width: `${cov}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                    <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
                        <Warehouse size={13} className="text-purple-400" /> Evacuation Capacity & Overflow
                      </h3>
                    </div>
                    <div className="flex flex-col gap-3 font-mono text-[11px]">
                      <div className="grid grid-cols-2 gap-3 bg-adcc-surface2/50 border border-adcc-border p-3 rounded-xl">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-adcc-textMuted uppercase font-bold">Assigned</span>
                          <span className="text-sm font-extrabold text-adcc-success">{outcomeReport.summary.shelter_metrics.assigned_population.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="text-[9px] text-adcc-textMuted uppercase font-bold">Overflow</span>
                          <span className={`text-sm font-extrabold ${outcomeReport.summary.shelter_metrics.unassigned_population > 0 ? 'text-adcc-danger animate-pulse' : 'text-adcc-success'}`}>
                            {outcomeReport.summary.shelter_metrics.unassigned_population.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {outcomeReport.summary.shelter_metrics.unassigned_population > 0 && (
                        <div className="p-3 border border-adcc-danger/30 bg-adcc-danger/8 text-adcc-danger rounded-xl flex items-start gap-2 text-[10px] leading-relaxed">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5 animate-bounce" />
                          <span>OVERFLOW DETECTED — Shelter infrastructure overloaded. Setup temporary transit camps.</span>
                        </div>
                      )}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {outcomeReport.summary.shelter_metrics.shelter_assignments.map((sh, i) => (
                          <div key={i} className="flex justify-between items-center pb-1.5 text-[10.5px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-adcc-textPrimary font-semibold">{sh.shelter_name}</span>
                              <span className="text-[9px] text-adcc-textMuted">{sh.distance_km} km away</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-adcc-accent font-bold">+{sh.assigned_people.toLocaleString()}</span>
                              <span className={`text-[8.5px] font-bold ${sh.new_occupancy_pct >= 90 ? 'text-adcc-danger' : 'text-adcc-textMuted'}`}>{sh.new_occupancy_pct}% full</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
                  <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
                      <Activity size={13} className="text-adcc-accent" /> What-If Severity Stress Factors
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-center">
                    {[
                      { label: 'Population Risk (40%)', val: outcomeReport.summary.predicted.breakdown.population_impact_score },
                      { label: 'Weather Risk (25%)',    val: outcomeReport.summary.predicted.breakdown.weather_risk_score },
                      { label: 'Magnitude Risk (20%)', val: outcomeReport.summary.predicted.breakdown.disaster_magnitude_score },
                      { label: 'Resource Strain (15%)',val: outcomeReport.summary.predicted.breakdown.resource_stress_score },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-3 bg-adcc-surface2/50 border border-adcc-border rounded-xl flex flex-col gap-1">
                        <span className="text-[9px] text-adcc-textMuted uppercase">{label}</span>
                        <span className="text-lg font-extrabold text-adcc-textPrimary">{val}<span className="text-xs font-normal text-adcc-textMuted">/100</span></span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {!outcomeReport && stepIndex < 0 && (
            <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center min-h-[320px]">
              <div className="p-4 bg-adcc-warning/10 border border-adcc-warning/25 rounded-2xl text-adcc-warning">
                <ShieldAlert size={28} />
              </div>
              <div className="font-mono text-[11px] text-adcc-textPrimary uppercase tracking-wider font-bold">DIGITAL TWIN STANDBY</div>
              <p className="text-[12px] text-adcc-textMuted leading-relaxed max-w-sm">
                Adjust delta percentages for rainfall, wind speed, populations, resources, and capacities. Press "Initialize Digital Twin Model" to run comparative what-if forecasts.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
export default Simulation;
