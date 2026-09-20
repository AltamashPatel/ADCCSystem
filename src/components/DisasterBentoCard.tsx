import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Wind, 
  Droplets, 
  Activity, 
  Sun, 
  Mountain, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Radio
} from 'lucide-react';
import { BackendDisaster } from '../services/api';
import { getDisasterImage } from '../utils/disasterImages';

interface DisasterBentoCardProps {
  disaster: BackendDisaster;
  onClick: (disaster: BackendDisaster) => void;
  index?: number;
}

export const DisasterBentoCard: React.FC<DisasterBentoCardProps> = ({ disaster, onClick, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = getDisasterImage(disaster);

  const getDisasterIcon = (type: string, size = 20) => {
    switch (type.toLowerCase()) {
      case 'wildfire':
        return <Flame size={size} className="text-orange-400" />;
      case 'cyclone':
      case 'hurricane':
        return <Wind size={size} className="text-rose-400" />;
      case 'flood':
        return <Droplets size={size} className="text-cyan-400" />;
      case 'heatwave':
        return <Sun size={size} className="text-amber-400" />;
      case 'landslide':
        return <Mountain size={size} className="text-emerald-400" />;
      default:
        return <Activity size={size} className="text-purple-400" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          badge: 'bg-rose-600/90 text-white border-rose-400/50 shadow-[0_0_12px_rgba(225,29,72,0.4)]',
          borderHover: 'hover:border-rose-500 hover:shadow-[0_0_28px_rgba(225,29,72,0.3)]',
          dot: 'bg-rose-400',
        };
      case 'high':
        return {
          badge: 'bg-orange-600/90 text-white border-orange-400/50 shadow-[0_0_12px_rgba(234,88,12,0.4)]',
          borderHover: 'hover:border-orange-500 hover:shadow-[0_0_28px_rgba(234,88,12,0.3)]',
          dot: 'bg-orange-400',
        };
      case 'medium':
        return {
          badge: 'bg-amber-600/90 text-white border-amber-400/50 shadow-[0_0_12px_rgba(217,119,6,0.4)]',
          borderHover: 'hover:border-amber-500 hover:shadow-[0_0_28px_rgba(217,119,6,0.3)]',
          dot: 'bg-amber-400',
        };
      default:
        return {
          badge: 'bg-emerald-600/90 text-white border-emerald-400/50 shadow-[0_0_12px_rgba(5,150,105,0.4)]',
          borderHover: 'hover:border-emerald-500 hover:shadow-[0_0_28px_rgba(5,150,105,0.3)]',
          dot: 'bg-emerald-400',
        };
    }
  };

  const sevStyle = getSeverityStyle(disaster.severity);
  const isCritical = disaster.severity.toLowerCase() === 'critical';
  const isUsa = disaster.country?.toUpperCase() === 'USA' || (disaster.longitude && disaster.longitude < -30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ scale: 1.03, y: -6, zIndex: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(disaster)}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 cursor-pointer transition-all duration-300 ${sevStyle.borderHover} ${
        isCritical ? 'col-span-1 md:col-span-2 min-h-[380px]' : 'col-span-1 min-h-[360px]'
      } flex flex-col justify-end shadow-xl`}
    >
      {/* Background Image with Zoom on Hover */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Cinematic Dark Gradient Layers for Crisp Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-80" />

      {/* Top Action & Status Badges */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${sevStyle.badge}`}>
            <span className={`h-2 w-2 rounded-full ${sevStyle.dot} ${isCritical ? 'animate-ping' : ''}`} />
            {disaster.severity}
          </span>

          {/* Region Badge */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/15 text-slate-200">
            {isUsa ? '🇺🇸 USA' : '🇮🇳 India'}
          </span>
        </div>

        {/* Verification Status Badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
          disaster.verification_status === 'Verified' 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' 
            : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
        }`}>
          {disaster.verification_status === 'Verified' ? <ShieldCheck size={14} /> : <Clock size={14} />}
          {disaster.verification_status}
        </span>
      </div>

      {/* Card Content & Hover Expansion Tray */}
      <div className="relative z-10 p-5 flex flex-col gap-3">
        {/* Disaster Type Pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white/10 backdrop-blur-md text-slate-100 border border-white/10">
            {getDisasterIcon(disaster.disaster_type, 16)}
            <span>{disaster.disaster_type}</span>
          </span>
          {disaster.source && (
            <span className="inline-flex items-center gap-1 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800/40">
              <Radio size={12} className="text-cyan-400" />
              {disaster.source.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Disaster Name (Large, Bold, High Legibility) */}
        <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md group-hover:text-cyan-300 transition-colors duration-200">
          {disaster.title}
        </h3>

        {/* Location Indicator */}
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <MapPin size={16} className="text-cyan-400 shrink-0" />
          <span className="truncate">
            {disaster.latitude.toFixed(3)}° N, {disaster.longitude.toFixed(3)}° {disaster.longitude >= 0 ? 'E' : 'W'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-semibold">{isUsa ? 'United States' : 'India'}</span>
        </div>

        {/* Hover-Expanded Detailed Info Tray */}
        <motion.div
          initial={false}
          animate={{
            height: isHovered ? 'auto' : 0,
            opacity: isHovered ? 1 : 0,
            marginTop: isHovered ? 8 : 0,
          }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="overflow-hidden flex flex-col gap-3 pt-1 border-t border-white/15"
        >
          {/* Detailed Info Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-sm font-medium">
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Users size={14} className="text-amber-400" />
                Affected Citizens
              </span>
              <span className="text-base font-bold text-white mt-0.5">
                {disaster.affected_population ? disaster.affected_population.toLocaleString() : 'Estimating...'}
              </span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Activity size={14} className="text-cyan-400" />
                AI Confidence
              </span>
              <span className="text-base font-bold text-cyan-300 mt-0.5">
                {disaster.confidence_score ? `${Math.round(disaster.confidence_score * 100)}% Consensus` : '95% Standard'}
              </span>
            </div>
          </div>

          {/* Interactive Inspection CTA */}
          <div className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all duration-200">
            <span>View AI Response, Robotics & Corridors</span>
            <ExternalLink size={16} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DisasterBentoCard;
