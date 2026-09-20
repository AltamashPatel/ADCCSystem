import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Radio, 
  Bot, 
  Truck, 
  Phone, 
  Compass, 
  Navigation, 
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import apiService, { BackendDisaster, BackendAllocation, BackendResource } from '../services/api';
import { getDisasterImage } from '../utils/disasterImages';

interface IncidentDetailModalProps {
  disaster: BackendDisaster | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({ disaster, onClose }) => {
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch live allocations for this disaster
  const { data: allocations = [], isLoading: allocationsLoading } = useQuery<BackendAllocation[]>({
    queryKey: ['allocations', disaster?.id],
    queryFn: () => apiService.getAllocations(disaster?.id),
    enabled: !!disaster,
  });

  // Fetch all resources to cross-reference capabilities and specs
  const { data: allResources = [] } = useQuery<BackendResource[]>({
    queryKey: ['resources'],
    queryFn: apiService.getResources,
    enabled: !!disaster,
  });

  if (!disaster) return null;

  const imageUrl = getDisasterImage(disaster);
  const isUsa = disaster.country?.toUpperCase() === 'USA' || (disaster.longitude && disaster.longitude < -30);

  // Filter allocations that belong to this disaster
  const currentAllocations = allocations.filter(
    a => a.disaster_id === disaster.id || (a.disaster_title && a.disaster_title.toLowerCase() === disaster.title.toLowerCase())
  );

  // Generate tactical AI response narrative based on hazard
  const getAIStrategyAnalysis = () => {
    const type = disaster.disaster_type.toLowerCase();
    const isCyclone = type === 'cyclone' || type === 'hurricane';
    const isWildfire = type === 'wildfire';
    const isFlood = type === 'flood';

    if (isCyclone) {
      return {
        priority: 'CRITICAL EVACUATION & PERIMETER RECON',
        summary: `Extreme cyclonic storm system with severe gale-force wind shears. Inflatable boats and surface lifeboats are strictly PROHIBITED due to capsize and projectile hazards. The Autonomous Allocation Agent has prioritized heavy tracked amphibious UGVs (Ghost Robotics Vision 60), high-clearance armored evacuation units, and thermal UAV reconnaissance drones.`,
        evacuationRadius: '35 km Coastal Storm Surge Buffer',
        leadAgency: isUsa ? 'FEMA Region IV / Florida Highway Patrol' : 'NDRF Battalion 04 / Indian Coast Guard',
      };
    } else if (isWildfire) {
      return {
        priority: 'CONTAINMENT & THERMAL STRUCTURAL DEFENSE',
        summary: `Rapid rate-of-spread wildfire complex driven by offshore winds and dry brush. AI Supervisor has deployed autonomous high-volume water cannon robots (Howe & Howe Thermite RS3) and dual-thermal reconnaissance UAVs (Skydio X10) to map fire flanks in zero-visibility conditions without endangering human firefighters.`,
        evacuationRadius: '20 km Downwind Smoke & Flame Perimeter',
        leadAgency: isUsa ? 'CAL FIRE / Los Angeles County Fire Dept' : 'State Disaster Response Force (SDRF)',
      };
    } else if (isFlood) {
      return {
        priority: 'CIVILIAN RESCUE & TRAFFIC ARTERY CLEARING',
        summary: `Severe waterlogged urban corridors and flash inundation. Autonomous agents have synchronized high-clearance emergency transport, submersible bathymetric ROVs, and mobile triage teams to clear stranded citizens along arterial transit hubs.`,
        evacuationRadius: '15 km Low-Lying Riverine Corridor',
        leadAgency: isUsa ? 'Texas DPS / Harris County Flood Control' : 'NDRF Unit 02 / Municipal Disaster Cell',
      };
    } else {
      return {
        priority: 'URBAN SEARCH & RESCUE DEBRIS STAGING',
        summary: `Seismic rupture and structural disruption recorded. The Autonomous Dispatcher has coordinated quadruped inspection robots (Boston Dynamics Spot Enterprise) for hazardous void search, gas sniffing, and heavy rubble clearance squads.`,
        evacuationRadius: '25 km Epicenter Seismic Zone',
        leadAgency: isUsa ? 'USGS / FEMA Urban Search & Rescue Task Force' : 'National Disaster Management Authority (NDMA)',
      };
    }
  };

  const aiStrategy = getAIStrategyAnalysis();

  const handleInspectOnMap = () => {
    onClose();
    navigate('/map', { state: { selectedDisasterId: disaster.id } });
  };

  const handleOpenCommandCenter = () => {
    onClose();
    navigate('/ai-command', { state: { targetDisaster: disaster } });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Hero Banner Header */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-black/40" />

            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all duration-200 cursor-pointer z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Hero Overlay Content */}
            <div className="absolute bottom-6 inset-x-6 z-10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white border border-rose-400/50 shadow-lg">
                  {disaster.severity} HAZARD
                </span>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 text-slate-200 border border-white/20 backdrop-blur-md">
                  {isUsa ? '🇺🇸 United States' : '🇮🇳 India'}
                </span>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 backdrop-blur-md flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  {disaster.verification_status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {disaster.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-slate-200 font-medium">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <MapPin size={18} className="text-cyan-400" />
                  {disaster.latitude.toFixed(4)}° N, {disaster.longitude.toFixed(4)}° {disaster.longitude >= 0 ? 'E' : 'W'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Users size={18} className="text-amber-400" />
                  {disaster.affected_population?.toLocaleString() ?? 'Unknown'} Citizens At Risk
                </span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1.5 text-slate-300 font-mono text-xs sm:text-sm">
                  <Radio size={16} className="text-cyan-400" />
                  Source: {disaster.source || 'GDACS / NWS'}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
            {/* 1. AI Situation Assessment & Strategy */}
            <div className="bg-slate-800/60 border border-cyan-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <BrainCircuit size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      AI Incident Strategy & Dispatch Protocol
                    </h2>
                    <p className="text-xs sm:text-sm text-cyan-400 font-mono">
                      Multi-Agent Coordination Model • Priority: {aiStrategy.priority}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">AI Consensus</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {disaster.confidence_score ? `${Math.round(disaster.confidence_score * 100)}%` : '96%'}
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-slate-300 font-normal">
                {aiStrategy.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 text-xs sm:text-sm">
                  <span className="text-slate-400 block font-semibold mb-1">Evacuation Perimeter:</span>
                  <span className="font-bold text-amber-300">{aiStrategy.evacuationRadius}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 text-xs sm:text-sm">
                  <span className="text-slate-400 block font-semibold mb-1">Coordinating Command Agency:</span>
                  <span className="font-bold text-cyan-300">{aiStrategy.leadAgency}</span>
                </div>
              </div>
            </div>

            {/* 2. Allocated Fleet, Robotics & Equipment */}
            <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      Dispatched Fleet & Advanced Robotics
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Emergency response units actively assigned to this disaster
                    </p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-mono px-3 py-1 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-lg">
                  {currentAllocations.length} Units Active
                </span>
              </div>

              {allocationsLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                  Querying logistics database for active fleet telemetry...
                </div>
              ) : currentAllocations.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-sm sm:text-base bg-slate-900/50 rounded-xl border border-dashed border-white/10 p-4">
                  No automated allocations currently registered for this incident. Click "Open AI Command Center" to generate new multi-agent dispatch plans.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAllocations.map(alloc => {
                    const matchedRes = allResources.find(r => r.id === alloc.resource_id);
                    const isRobot = alloc.resource_type?.toLowerCase().includes('robot') || matchedRes?.resource_type?.toLowerCase().includes('robot');
                    const modelSpec = alloc.resource_model || matchedRes?.model_spec;

                    return (
                      <div 
                        key={alloc.id}
                        className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isRobot ? (
                                <Bot size={20} className="text-cyan-400 shrink-0" />
                              ) : (
                                <Truck size={20} className="text-amber-400 shrink-0" />
                              )}
                              <h3 className="font-bold text-base text-white">
                                {alloc.resource_name || 'Emergency Unit'}
                              </h3>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              alloc.status === 'Reached'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                : alloc.status === 'En Route'
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                                : alloc.status === 'Issue Reported'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                            }`}>
                              {alloc.status}
                            </span>
                          </div>

                          {modelSpec && (
                            <p className="text-xs font-mono text-cyan-400 mt-1 pl-7">
                              Hardware Model: {modelSpec}
                            </p>
                          )}

                          {alloc.allocation_reason && (
                            <p className="text-xs italic text-slate-300 mt-2 bg-slate-950/50 p-2 rounded-lg border border-white/5">
                              "{alloc.allocation_reason}"
                            </p>
                          )}
                        </div>

                        {/* Dispatch Telemetry & Hotline */}
                        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Navigation size={14} className="text-cyan-400" />
                            <span>{alloc.distance_km ? `${alloc.distance_km.toFixed(1)} km (${(alloc.distance_km * 0.621371).toFixed(1)} mi)` : 'Transit Pending'}</span>
                          </div>

                          {alloc.contact_phone && (
                            <a
                              href={`tel:${alloc.contact_phone}`}
                              className="flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                            >
                              <Phone size={14} />
                              <span>{alloc.contact_name ? `${alloc.contact_name}: ` : ''}{alloc.contact_phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Safe Corridors & Tactical Routes */}
            <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Compass size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Designated Evacuation & Emergency Corridors
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    High-priority transit arteries cleared for multi-agency mobilization
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-medium">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 uppercase font-bold text-xs block mb-1">Transit Route</span>
                  <span className="font-bold text-white text-sm sm:text-base">
                    {isUsa ? 'Interstate Logistics Highway' : 'National Express Corridor'}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 uppercase font-bold text-xs block mb-1">Average Response Speed</span>
                  <span className="font-bold text-cyan-300 text-sm sm:text-base">~45–65 km/h (Priority Beacon)</span>
                </div>
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 uppercase font-bold text-xs block mb-1">Corridor Status</span>
                  <span className="font-bold text-emerald-400 text-sm sm:text-base">ACTIVE & SECURED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-5 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all duration-200 cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCommandCenter}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>AI Command Center</span>
                <BrainCircuit size={16} />
              </button>

              <button
                onClick={handleInspectOnMap}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Inspect on Live Map</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncidentDetailModal;
