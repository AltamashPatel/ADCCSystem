import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { 
  BackendDisaster, 
  BackendHospital, 
  BackendShelter, 
  BackendResource,
  BackendAllocation 
} from '../services/api';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { 
  Compass, 
  MapPin, 
  Flame, 
  Wind, 
  Droplets, 
  Activity, 
  Filter,
  HeartPulse,
  Home,
  Boxes,
  Map as MapIcon,
  RefreshCw,
  Cpu,
  Phone
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type MapEntity = 
  | { type: 'disaster'; data: BackendDisaster }
  | { type: 'hospital'; data: BackendHospital }
  | { type: 'shelter'; data: BackendShelter }
  | { type: 'resource'; data: BackendResource }
  | { type: 'route'; data: any };

const getSimulatedRouteSteps = (res: BackendResource, dis: BackendDisaster, distKm: number) => {
  const steps: string[] = [];
  const isUsa = res.country?.toUpperCase() === 'USA' || dis.country?.toUpperCase() === 'USA' || (res.longitude && res.longitude < -30);
  
  steps.push(`Depart ${res.resource_name} Depot at (${res.latitude?.toFixed(3)}°, ${res.longitude?.toFixed(3)}°)`);
  
  let routeName = isUsa ? "US Interstate Logistics Corridor" : "National Highway Corridor";
  if (isUsa) {
    if (dis.title.toLowerCase().includes("california") || dis.title.toLowerCase().includes("los angeles") || dis.title.toLowerCase().includes("san francisco") || res.resource_name.toLowerCase().includes("california") || res.resource_name.toLowerCase().includes("ca")) {
      routeName = "I-5 / US-101 Pacific Transit Corridor";
      steps.push("Deploy via Interstate 5 North/South emergency transit lane with priority beacon protocol.");
      steps.push("Transition to US-101 / local highway link toward disaster staging perimeter.");
    } else if (dis.title.toLowerCase().includes("florida") || dis.title.toLowerCase().includes("tampa") || dis.title.toLowerCase().includes("miami") || res.resource_name.toLowerCase().includes("florida") || res.resource_name.toLowerCase().includes("fl")) {
      routeName = "I-75 / I-4 Sunshine State Corridor";
      steps.push("Deploy along I-75 / I-4 expressway coordinating with Florida Highway Patrol.");
      steps.push("Advance toward regional emergency mobilization zone outside flood perimeter.");
    } else if (dis.title.toLowerCase().includes("texas") || dis.title.toLowerCase().includes("houston") || res.resource_name.toLowerCase().includes("texas") || res.resource_name.toLowerCase().includes("tx")) {
      routeName = "I-10 / I-45 Gulf Freeway Corridor";
      steps.push("Access I-10 East emergency convoy route cleared by Texas DPS.");
      steps.push("Proceed directly to Houston Metro rapid-response staging hub.");
    } else {
      routeName = "US Federal Disaster Response Corridor";
      steps.push("Transit along US Interstate highway under FEMA Blue Sky priority dispatch.");
    }
  } else {
    if (distKm < 200) {
      if (res.resource_name.includes("MH") || dis.title.toLowerCase().includes("mumbai") || dis.title.toLowerCase().includes("pune")) {
        routeName = "Mumbai-Pune Expressway / NH-48";
        steps.push("Merge onto NH-48 Expressway heading West towards Mumbai.");
        steps.push("Proceed through Lonavala toll plaza, keeping right at Expressway fork.");
        steps.push("Enter Mumbai Metropolitan Region via Vashi / Sion Corridor.");
      } else if (dis.title.toLowerCase().includes("rishikesh") || dis.title.toLowerCase().includes("delhi")) {
        routeName = "NH-334 Bypass Corridor";
        steps.push("Merge onto NH-58 / NH-334 heading North via Meerut-Haridwar Highway.");
        steps.push("Proceed along Haridwar bypass, keeping right towards Rishikesh.");
      } else {
        routeName = "State Highway Corridor";
        steps.push("Merge onto closest regional highway link heading towards incident zone.");
      }
    } else {
      if (dis.title.toLowerCase().includes("guwahati") || dis.title.toLowerCase().includes("assam") || dis.title.toLowerCase().includes("kolkata")) {
        routeName = "NH-27 East-West Highway Corridor";
        steps.push("Merge onto NH-12 heading North towards Siliguri corridor.");
        steps.push("Connect to NH-27 (East-West Highway) heading East via Bongaigaon.");
      } else {
        routeName = "National Highway Corridor (NH-27 / NH-48)";
        steps.push("Proceed along National Highway corridor towards target zone coordinates.");
      }
    }
  }
  
  steps.push(`Arrive at ${dis.title} target zone (${dis.latitude.toFixed(3)}°, ${dis.longitude.toFixed(3)}°) for emergency operations.`);
  return { routeName, steps };
};

const getResourceMarkerHtml = (res: BackendResource) => {
  const type = res.resource_type.toLowerCase();

  // High-Tech Robot Marker (Cyan Glow)
  if (type === 'robot') {
    return `
      <div class="relative flex items-center justify-center animate-fade-in" style="width: 34px; height: 34px;" title="${res.resource_name} (${res.model_spec || 'Robotics'})">
        <div class="absolute inset-0 rounded-full animate-ping opacity-35" style="background-color: #06B6D4; animation-duration: 2.2s;"></div>
        <div class="w-7 h-7 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-300 transition-all duration-200 hover:scale-125" 
             style="background: radial-gradient(circle, rgba(6,182,212,0.4) 0%, #06111E 100%); box-shadow: 0 0 14px rgba(6, 182, 212, 0.85);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
          </svg>
        </div>
      </div>
    `;
  }

  // Evacuation Team Marker (Amber Glow)
  if (type === 'evacuation team' || type === 'evacuation_team') {
    return `
      <div class="relative flex items-center justify-center animate-fade-in" style="width: 30px; height: 30px;" title="${res.resource_name}">
        <div class="w-6 h-6 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-300 transition-all duration-200 hover:scale-125" 
             style="background: #78350F; box-shadow: 0 0 10px rgba(245, 158, 11, 0.65);">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
      </div>
    `;
  }

  // Ambulance Marker (Red/White)
  if (type === 'ambulance') {
    return `
      <div class="relative flex items-center justify-center animate-fade-in" style="width: 28px; height: 28px;" title="${res.resource_name}">
        <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white transition-all duration-200 hover:scale-115" 
             style="background-color: #DC2626; box-shadow: 0 2px 6px rgba(0,0,0,0.65);">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 17h4V9h-4z"/><path d="M19 17h2b-2 0"/><path d="M14 9V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4z"/><path d="M7 11h4"/><path d="M9 9v4"/>
          </svg>
        </div>
      </div>
    `;
  }

  // Boat Marker (Marine Blue)
  if (type === 'boat') {
    return `
      <div class="relative flex items-center justify-center animate-fade-in" style="width: 28px; height: 28px;" title="${res.resource_name}">
        <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white transition-all duration-200 hover:scale-115" 
             style="background-color: #0284C7; box-shadow: 0 2px 6px rgba(0,0,0,0.65);">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10V2"/>
          </svg>
        </div>
      </div>
    `;
  }

  // Generic Default
  return `
    <div class="relative flex items-center justify-center animate-fade-in" style="width: 28px; height: 28px;" title="${res.resource_name}">
      <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white transition-all duration-200 hover:scale-115" 
           style="background-color: #16A34A; box-shadow: 0 2px 5px rgba(0,0,0,0.65);">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      </div>
    </div>
  `;
};

const getDisasterMarkerHtml = (type: string, severity: string, status: string) => {
  let glowColor = 'rgba(16, 185, 129, 0.45)';
  let strokeColor = '#10B981';
  let innerColor = 'rgba(16, 185, 129, 0.15)';

  switch (severity.toLowerCase()) {
    case 'critical':
      glowColor = 'rgba(239, 68, 68, 0.45)';
      strokeColor = '#EF4444';
      innerColor = 'rgba(239, 68, 68, 0.15)';
      break;
    case 'high':
      glowColor = 'rgba(249, 115, 22, 0.45)';
      strokeColor = '#F97316';
      innerColor = 'rgba(249, 115, 22, 0.15)';
      break;
    case 'medium':
      glowColor = 'rgba(245, 158, 11, 0.45)';
      strokeColor = '#F59E0B';
      innerColor = 'rgba(245, 158, 11, 0.15)';
      break;
  }

  let svgPath = '';
  switch (type.toLowerCase()) {
    case 'flood':
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`;
      break;
    case 'cyclone':
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.8 3a2.4 2.4 0 0 0-2.2 3.1A2.4 2.4 0 0 0 12.8 8h6.2a2.4 2.4 0 0 0 0-4.8H12.8Z"/><path d="M8.2 11a2.4 2.4 0 0 0-2.2 3.1A2.4 2.4 0 0 0 8.2 16h8.2a2.4 2.4 0 0 0 0-4.8H8.2Z"/><path d="M5.4 7a2.4 2.4 0 0 0-2.2 3.1A2.4 2.4 0 0 0 5.4 12h11.2a2.4 2.4 0 0 0 0-4.8H5.4Z"/></svg>`;
      break;
    case 'earthquake':
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
      break;
    case 'wildfire':
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      break;
    case 'heatwave':
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>`;
      break;
    default:
      svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
  }

  return `
    <div class="relative flex items-center justify-center animate-fade-in" style="width: 38px; height: 38px;">
      ${status === 'Active' ? `
        <div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${glowColor}; animation-duration: 2.5s;"></div>
        <div class="absolute inset-1.5 rounded-full border border-dashed opacity-25 animate-spin" style="border-color: ${strokeColor}; animation-duration: 15s;"></div>
      ` : ''}
      <div class="absolute inset-1.5 rounded-full border-2 flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110" 
           style="background: radial-gradient(circle, ${innerColor} 0%, rgba(11, 18, 32, 0.95) 100%); border-color: ${strokeColor}; box-shadow: 0 0 15px ${glowColor};">
        <div class="flex items-center justify-center" style="color: ${strokeColor};">
          ${svgPath}
        </div>
      </div>
    </div>
  `;
};

export const DisasterMap: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: apiService.syncDisasters,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disasters'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
  
  const { theme } = useTheme();

  useEffect(() => {
    console.log(`Active Tactical GIS Map Theme: ${theme}`);
  }, [theme]);
  
  // Layer toggles
  const [showDisasters, setShowDisasters] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Search & opacity inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [radarOpacity, setRadarOpacity] = useState(0.08);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [region, setRegion] = useState<'all' | 'USA' | 'India'>('all');

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerLayerGroupRef = useRef<any>(null);

  // Fetch live layers
  const { data: disasters = [] } = useQuery({ queryKey: ['disasters'], queryFn: apiService.getDisasters });
  const { data: hospitals = [] } = useQuery({ queryKey: ['hospitals'], queryFn: apiService.getHospitals });
  const { data: shelters = [] } = useQuery({ queryKey: ['shelters'], queryFn: apiService.getShelters });
  const { data: resources = [] } = useQuery<BackendResource[]>({ queryKey: ['resources'], queryFn: apiService.getResources });
  const { data: allocations = [] } = useQuery<BackendAllocation[]>({ queryKey: ['allocations'], queryFn: () => apiService.getAllocations() });

  // Region matcher helper
  const isMatchingRegion = (itemCountry?: string, lng?: number) => {
    if (region === 'all') return true;
    if (region === 'USA') {
      return itemCountry?.toUpperCase() === 'USA' || (lng !== undefined && lng < -30);
    }
    if (region === 'India') {
      return itemCountry?.toUpperCase() === 'INDIA' || (lng !== undefined && lng > 60 && lng < 100);
    }
    return true;
  };

  // Region camera jump
  const handleRegionChange = (newRegion: 'all' | 'USA' | 'India') => {
    setRegion(newRegion);
    const map = mapInstanceRef.current;
    if (!map) return;
    if (newRegion === 'USA') {
      map.flyTo([38.5, -96.5], 4, { duration: 1.2 });
    } else if (newRegion === 'India') {
      map.flyTo([22.5, 80.0], 5, { duration: 1.2 });
    } else {
      map.flyTo([25.0, 10.0], 2.5, { duration: 1.2 });
    }
  };

  // Filtered lists
  const filteredDisasters = disasters.filter(d => {
    const matchesType = filterType === 'all' || d.disaster_type.toLowerCase() === filterType.toLowerCase();
    const matchesSeverity = filterSeverity === 'all' || d.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.disaster_type.toLowerCase().includes(searchQuery.toLowerCase());
    const inRegion = isMatchingRegion(d.country, d.longitude);
    return matchesType && matchesSeverity && matchesSearch && inRegion;
  });

  const filteredHospitals = hospitals.filter(h => isMatchingRegion(h.country, h.longitude));
  const filteredShelters = shelters.filter(s => isMatchingRegion(s.country, s.longitude));
  const filteredResources = resources.filter(r => isMatchingRegion(r.country, r.longitude));

  const getDisasterIcon = (type: string, size = 16) => {
    switch (type.toLowerCase()) {
      case 'wildfire': return <Flame size={size} className="text-[#F97316]" />;
      case 'cyclone': return <Wind size={size} className="text-[#EF4444]" />;
      case 'flood': return <Droplets size={size} className="text-[#00E5FF]" />;
      default: return <Activity size={size} className="text-[#A78BFA]" />;
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'border-adcc-danger text-adcc-danger';
      case 'high': return 'border-[#F97316] text-[#F97316]';
      case 'medium': return 'border-adcc-warning text-adcc-warning';
      default: return 'border-adcc-success text-adcc-success';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-[#EF4444] text-white';
      case 'high': return 'bg-[#F97316] text-white';
      case 'medium': return 'bg-[#F59E0B] text-adcc-bg';
      default: return 'bg-[#10B981] text-white';
    }
  };



  // Broad fallback bounds
  // Broad fallback bounds
  const getMapBounds = () => {
    const points: Array<{ lat: number; lng: number }> = [];
    if (showDisasters) filteredDisasters.forEach(d => points.push({ lat: d.latitude, lng: d.longitude }));
    if (showHospitals) filteredHospitals.forEach(h => points.push({ lat: h.latitude, lng: h.longitude }));
    if (showShelters) filteredShelters.forEach(s => points.push({ lat: s.latitude, lng: s.longitude }));
    if (showResources) filteredResources.forEach(r => { if (r.latitude && r.longitude) points.push({ lat: r.latitude, lng: r.longitude }); });

    if (points.length === 0) {
      if (region === 'USA') return { minLat: 24.5, maxLat: 49.3, minLng: -125.0, maxLng: -66.9 };
      if (region === 'India') return { minLat: 8.33, maxLat: 37.44, minLng: 65.22, maxLng: 97.68 };
      return { minLat: 8.33, maxLat: 49.3, minLng: -125.0, maxLng: 97.68 };
    }
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  };

  const bounds = getMapBounds();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet library not loaded");
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [25.0, 10.0], // Global initial view
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Tile Layers
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    });

    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    // Default layer
    satelliteLayer.addTo(map);

    const baseMaps = {
      "Dark View (ADCC Theme)": darkLayer,
      "Terrain (Elevation)": terrainLayer,
      "Satellite Imagery": satelliteLayer,
      "Street Map": streetLayer
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    const markerLayerGroup = L.layerGroup().addTo(map);
    markerLayerGroupRef.current = markerLayerGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when layers or filters change
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markerLayerGroupRef.current) return;

    const markerLayerGroup = markerLayerGroupRef.current;
    markerLayerGroup.clearLayers();

    // 1. Render Disasters
    if (showDisasters) {
      filteredDisasters.forEach(d => {
        // Draw concentric impact zones (heatmaps)
        let strokeColor = '#EF4444';
        if (d.severity.toLowerCase() === 'high') strokeColor = '#F97316';
        if (d.severity.toLowerCase() === 'medium') strokeColor = '#F59E0B';
        if (d.severity.toLowerCase() === 'low') strokeColor = '#10B981';

        const circle = L.circle([d.latitude, d.longitude], {
          radius: d.affected_population ? Math.min(200000, Math.sqrt(d.affected_population) * 85) : 15000,
          color: strokeColor,
          weight: 1,
          fillColor: strokeColor,
          fillOpacity: radarOpacity,
          dashArray: '4, 4'
        });
        circle.addTo(markerLayerGroup);

        const marker = L.marker([d.latitude, d.longitude], {
          icon: L.divIcon({
            className: 'custom-disaster-pin',
            html: getDisasterMarkerHtml(d.disaster_type, d.severity, d.status),
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          })
        });
        marker.on('click', () => setSelectedEntity({ type: 'disaster', data: d }));
        marker.addTo(markerLayerGroup);
      });
    }

    // 2. Render Hospitals
    if (showHospitals) {
      filteredHospitals.forEach(h => {
        const marker = L.marker([h.latitude, h.longitude], {
          icon: L.divIcon({
            className: 'custom-hospital-pin',
            html: `
              <div class="relative flex items-center justify-center animate-fade-in" style="width: 28px; height: 28px;">
                <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-115" 
                     style="background-color: #2563EB; box-shadow: 0 2px 5px rgba(0,0,0,0.65);">
                  <span class="text-[11px] font-sans font-black leading-none" style="margin-top: -0.5px;">H</span>
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });
        marker.on('click', () => setSelectedEntity({ type: 'hospital', data: h }));
        marker.addTo(markerLayerGroup);
      });
    }

    // 3. Render Shelters
    if (showShelters) {
      filteredShelters.forEach(s => {
        const marker = L.marker([s.latitude, s.longitude], {
          icon: L.divIcon({
            className: 'custom-shelter-pin',
            html: `
              <div class="relative flex items-center justify-center animate-fade-in" style="width: 28px; height: 28px;">
                <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white transition-all duration-200 hover:scale-115" 
                     style="background-color: #D97706; box-shadow: 0 2px 5px rgba(0,0,0,0.65);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });
        marker.on('click', () => setSelectedEntity({ type: 'shelter', data: s }));
        marker.addTo(markerLayerGroup);
      });
    }

    // 4. Render Resources
    if (showResources) {
      filteredResources.forEach(r => {
        if (!r.latitude || !r.longitude) return;
        const marker = L.marker([r.latitude, r.longitude], {
          icon: L.divIcon({
            className: 'custom-resource-pin',
            html: getResourceMarkerHtml(r),
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        });
        marker.on('click', () => setSelectedEntity({ type: 'resource', data: r }));
        marker.addTo(markerLayerGroup);
      });
    }

    // 5. Render Routing Paths for Active/Dispatched Allocations
    if (showRoutes) {
      allocations.forEach(alloc => {
        const isRouteActive = alloc.status === 'Active' || alloc.status === 'Dispatched' || alloc.status === 'En Route';
        if (!isRouteActive) return;
        
        const resource = resources.find(r => r.id === alloc.resource_id);
        const disaster = disasters.find(d => d.id === alloc.disaster_id);
        
        if (resource && disaster && resource.latitude && resource.longitude && disaster.latitude && disaster.longitude) {
          const distance = mapInstanceRef.current.distance(
            [resource.latitude, resource.longitude],
            [disaster.latitude, disaster.longitude]
          ) / 1000.0;
          
          const routeDetails = getSimulatedRouteSteps(resource, disaster, distance);
          
          const polyline = L.polyline(
            [[resource.latitude, resource.longitude], [disaster.latitude, disaster.longitude]],
            {
              color: alloc.issue_description ? '#EF4444' : '#00E5FF',
              weight: 3,
              dashArray: '8, 8',
              opacity: 0.85,
              className: 'animated-route-line'
            }
          );
          
          polyline.on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            setSelectedEntity({
              type: 'route',
              data: {
                ...alloc,
                resourceName: resource.resource_name,
                resourceType: resource.resource_type,
                disasterTitle: disaster.title,
                distanceKm: distance,
                routeSteps: routeDetails
              }
            });
          });
          
          polyline.addTo(markerLayerGroup);
        }
      });
    }
  }, [showDisasters, showHospitals, showShelters, showResources, showRoutes, filteredDisasters, filteredHospitals, filteredShelters, filteredResources, allocations, region]);

  // Fit bounds dynamically on initial data load
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    const points: Array<[number, number]> = [];
    if (showDisasters) filteredDisasters.forEach(d => points.push([d.latitude, d.longitude]));
    if (showHospitals) filteredHospitals.forEach(h => points.push([h.latitude, h.longitude]));
    if (showShelters) filteredShelters.forEach(s => points.push([s.latitude, s.longitude]));
    if (showResources) filteredResources.forEach(r => { if (r.latitude && r.longitude) points.push([r.latitude, r.longitude]); });

    if (points.length > 0) {
      mapInstanceRef.current.fitBounds(points, { padding: [50, 50], maxZoom: 8 });
    }
  }, [disasters.length, hospitals.length, shelters.length, resources.length]);

  return (
    <PageContainer>
      <SectionHeader 
        title="Tactical Incident Map" 
        description="Geospatial overlay of live disasters, hospitals, shelters, and resource allocations across USA and India."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-210px)] min-h-[550px]">
        
        {/* Map Interface Area */}
        <div className="lg:col-span-3 glass-panel rounded-2xl relative overflow-hidden flex flex-col">
          
          {/* Map Top Bar (Filters & Layers) */}
          <div className="p-3 flex flex-wrap items-center justify-between gap-3 z-[1001] border-b border-adcc-border bg-adcc-surface/75 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-mono">
              {/* Region Jump Controls */}
              <div className="flex items-center gap-1 border-r border-gray-800 pr-2.5 mr-1">
                <button
                  type="button"
                  onClick={() => handleRegionChange('all')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    region === 'all' 
                      ? 'bg-adcc-accent text-adcc-bg font-black shadow-sm' 
                      : 'text-adcc-textMuted hover:text-adcc-textPrimary bg-adcc-bg border border-gray-850'
                  }`}
                  title="Global View (USA + India)"
                >
                  🌐 Global
                </button>
                <button
                  type="button"
                  onClick={() => handleRegionChange('USA')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    region === 'USA' 
                      ? 'bg-cyan-500 text-adcc-bg font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                      : 'text-adcc-textMuted hover:text-adcc-textPrimary bg-adcc-bg border border-gray-850'
                  }`}
                  title="United States Operations (NOAA / USGS / Robotics)"
                >
                  🇺🇸 USA
                </button>
                <button
                  type="button"
                  onClick={() => handleRegionChange('India')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    region === 'India' 
                      ? 'bg-amber-500 text-adcc-bg font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
                      : 'text-adcc-textMuted hover:text-adcc-textPrimary bg-adcc-bg border border-gray-850'
                  }`}
                  title="India Operations"
                >
                  🇮🇳 India
                </button>
              </div>

              {disasters.some(d => d.source === 'DEMO') && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-500 font-mono text-[10px] font-bold tracking-wider mr-2">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  DEMO MODE ACTIVE
                </div>
              )}
              <Filter size={14} className="text-adcc-accent" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-[11px] font-mono rounded-lg px-2.5 py-1.5 bg-adcc-surface border border-adcc-border"
              >
                <option value="all">ALL HAZARDS</option>
                <option value="cyclone">CYCLONES / HURRICANES</option>
                <option value="wildfire">WILDFIRES</option>
                <option value="flood">FLOODS</option>
                <option value="earthquake">EARTHQUAKES</option>
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-[11px] font-mono rounded-lg px-2.5 py-1.5 bg-adcc-surface border border-adcc-border"
              >
                <option value="all">ALL SEVERITY</option>
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>

              <button 
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ml-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={11} className={syncMutation.isPending ? 'animate-spin' : ''} />
                {syncMutation.isPending ? 'Syncing...' : 'Sync Live NWS/GDACS'}
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono select-none">
              {[
                { state: showDisasters, setter: setShowDisasters, label: 'HAZARDS', activeColor: 'bg-adcc-danger/25 text-adcc-danger border-adcc-danger/40 shadow-[0_0_8px_rgba(244,63,94,0.2)] font-black' },
                { state: showHospitals, setter: setShowHospitals, label: 'HOSPITALS', activeColor: 'bg-blue-500/25 text-blue-400 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)] font-black' },
                { state: showShelters, setter: setShowShelters, label: 'SHELTERS', activeColor: 'bg-purple-500/25 text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)] font-black' },
                { state: showResources, setter: setShowResources, label: 'RESOURCES', activeColor: 'bg-green-500/25 text-green-400 border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)] font-black' },
                { state: showRoutes, setter: setShowRoutes, label: 'ROUTES', activeColor: 'bg-adcc-accent/25 text-adcc-accent border-adcc-accent/40 shadow-[0_0_8px_rgba(0,224,255,0.2)] font-black' },
              ].map(({ state, setter, label, activeColor }) => (
                <button
                  key={label}
                  onClick={() => setter(!state)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    state ? activeColor : 'bg-adcc-surface2/40 text-adcc-textMuted border-adcc-border hover:text-adcc-textPrimary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="flex-1 relative bg-[#060A13] overflow-hidden select-none">
            {/* Leaflet Map Div container */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full tactical-satellite-tiles" />

            {/* Grid Overlay on top of background map slightly */}
            <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none z-10" />

            {/* Contextual HUD Action Dock */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-adcc-surface/90 backdrop-blur-xl border border-adcc-accentBorder px-4 py-3 rounded-2xl z-[1000] flex flex-col md:flex-row items-center gap-4 shadow-elevated w-[90%] max-w-[680px]">
              
              {/* Cmd+K Search Bar */}
              <div className="relative w-full md:w-44 flex items-center">
                <input
                  type="text"
                  placeholder="Cmd + K Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-[10px] font-mono pl-7 pr-2.5 py-1.5 w-full rounded-lg bg-adcc-surface2 border border-adcc-border focus:border-adcc-accent"
                />
                <span className="absolute left-2 text-[10px] text-adcc-textMuted font-mono">⌘</span>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  onClick={() => alert("Dispatching SMS evacuation alert payload via Twilio Integration.")}
                  className="px-2 py-1 bg-adcc-danger/15 hover:bg-adcc-danger hover:text-white border border-adcc-danger/30 rounded-lg text-[8.5px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Evac SMS
                </button>
                <button
                  onClick={() => alert("NDRF Rescue Battalion mobilized to coordinates.")}
                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-adcc-bg border border-amber-500/30 rounded-lg text-[8.5px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Deploy NDRF
                </button>
                <button
                  onClick={() => alert("Rerouting emergency resources through safe bypass nodes.")}
                  className="px-2 py-1 bg-adcc-accentDim hover:bg-adcc-accent hover:text-adcc-bg border border-adcc-accentBorder rounded-lg text-[8.5px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Safe Route
                </button>
                <button
                  onClick={() => alert("GDACS emergency bulletin broadcasted to global alerts register.")}
                  className="px-2 py-1 bg-green-500/15 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-lg text-[8.5px] uppercase font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer"
                >
                  GDACS Alert
                </button>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2 text-[9px] font-mono text-adcc-textMuted shrink-0">
                <span>RADAR OPACITY:</span>
                <input
                  type="range"
                  min="0"
                  max="0.30"
                  step="0.05"
                  value={radarOpacity}
                  onChange={e => setRadarOpacity(parseFloat(e.target.value))}
                  className="w-16 cursor-pointer"
                />
              </div>
            </div>

            {/* Tactical Compass Overlay */}
            <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1 bg-adcc-bg/85 border border-adcc-border p-2.5 rounded-lg z-[1000] pointer-events-none font-mono">
              <Compass className="text-adcc-accent animate-[spin_30s_linear_infinite]" size={24} />
              <span className="text-[8px] font-mono text-adcc-textMuted uppercase tracking-widest">TACTICAL GRID</span>
            </div>

            {/* Top-Left Telemetry Coordinates */}
            <div className="absolute top-4 left-4 bg-adcc-bg/85 border border-adcc-border p-3 rounded-lg z-[1000] pointer-events-none font-mono text-[9px] text-adcc-textMuted flex flex-col gap-0.5">
              <span className="text-adcc-accent font-bold uppercase tracking-wider">MAP VIEW TELEMETRY</span>
              <span>BOUNDS: [{bounds.minLat.toFixed(2)}N, {bounds.minLng.toFixed(2)}E] TO [{bounds.maxLat.toFixed(2)}N, {bounds.maxLng.toFixed(2)}E]</span>
              <span>Ingested: {disasters.length} records</span>
            </div>
          </div>
        </div>

        {/* Selected Entity Details Panel */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
          
          {/* Section 1: AI Node Graph (LangGraph Execution) */}
          <div className="flex flex-col gap-3 pb-3 border-b border-adcc-border">
            <h3 className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5">
              <Cpu size={13} className="text-adcc-accent" />
              LangGraph Orchestrator Node
            </h3>
            
            <div className="p-3 bg-slate-950/45 rounded-xl border border-adcc-border/60 flex flex-col gap-2.5 font-mono text-[9px] relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-16 h-16 bg-adcc-accent/5 rounded-full blur-xl pointer-events-none" />
              {/* Nodes layout */}
              <div className="flex justify-between items-center relative py-1">
                {/* SVG connection path lines */}
                <div className="absolute left-[15px] right-[15px] top-[14px] h-[1px] bg-gradient-to-r from-green-500/40 via-adcc-accent/40 to-adcc-accent/20 z-0" />
                
                {[
                  { name: 'INGEST', state: 'nominal', latency: '42ms' },
                  { name: 'COGNITIVE', state: 'active', latency: '120ms' },
                  { name: 'ROUTE', state: 'pending', latency: '--' },
                ].map((node, i) => (
                  <div key={node.name} className="flex flex-col items-center gap-1 z-10">
                    <div className="relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black ${
                        node.state === 'nominal' ? 'bg-green-500/10 border-green-500/40 text-green-400' :
                        node.state === 'active' ? 'bg-adcc-accentDim border-adcc-accent text-adcc-accent animate-pulse shadow-glow' :
                        'bg-adcc-surface2 border-adcc-border text-adcc-textMuted'
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        node.state === 'nominal' ? 'bg-green-500' :
                        node.state === 'active' ? 'bg-adcc-accent animate-ping' :
                        'bg-slate-600'
                      }`} />
                    </div>
                    <span className="text-[8px] font-black text-adcc-textPrimary mt-0.5">{node.name}</span>
                    <span className="text-[7.5px] text-adcc-textMuted leading-none">{node.latency}</span>
                  </div>
                ))}
              </div>

              {/* Status footer */}
              <div className="flex justify-between items-center pt-2 border-t border-adcc-border/30 text-[8.5px] text-adcc-textMuted">
                <span>Node Status:</span>
                <span className="text-adcc-accent font-bold uppercase">PROCESSING EPISODE</span>
              </div>
            </div>
          </div>

          {/* Section 2: Telemetry Inspector */}
          <div className="flex-1 overflow-y-auto pr-1">
            <h3 className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-1.5 mb-3">
              <MapIcon size={13} className="text-adcc-accent" />
              GIS Tactical Telemetry
            </h3>

            <AnimatePresence mode="wait">
              {selectedEntity ? (
                <motion.div
                  key={selectedEntity.data.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4 font-mono text-xs"
                >
                  {/* Category Badge */}
                  <span className={`px-2 py-0.5 self-start text-[9px] uppercase font-bold border rounded tracking-wider ${
                    selectedEntity.type === 'disaster' ? getSeverityBorderColor((selectedEntity.data as BackendDisaster).severity) :
                    selectedEntity.type === 'hospital' ? 'border-[#00E5FF] text-[#00E5FF]' :
                    selectedEntity.type === 'shelter' ? 'border-purple-500 text-purple-400' :
                    'border-green-500 text-green-400'
                  }`}>
                    {selectedEntity.type.toUpperCase()}
                  </span>

                  {/* Title / Name */}
                  <h4 className="text-sm font-bold text-adcc-textPrimary flex items-center gap-1.5">
                    {selectedEntity.type === 'disaster' && getDisasterIcon((selectedEntity.data as BackendDisaster).disaster_type)}
                    {selectedEntity.type === 'hospital' && <HeartPulse size={15} className="text-[#00E5FF]" />}
                    {selectedEntity.type === 'shelter' && <Home size={15} className="text-purple-400" />}
                    {selectedEntity.type === 'resource' && <Boxes size={15} className="text-green-400" />}
                    {selectedEntity.type === 'disaster' ? (selectedEntity.data as BackendDisaster).title :
                     selectedEntity.type === 'hospital' ? (selectedEntity.data as BackendHospital).name :
                     selectedEntity.type === 'shelter' ? (selectedEntity.data as BackendShelter).name :
                     (selectedEntity.data as BackendResource).resource_name}
                  </h4>

                  {/* Mock Satellite Radar Scan Grid */}
                  <div className="relative h-28 w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                    {/* Grid lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(56,189,248,0.12)_1.2px,transparent_1.2px)] bg-[size:12px_12px]" />
                    {/* Concentric scan lines */}
                    <div className="absolute w-20 h-20 rounded-full border border-adcc-accent/20 animate-pulse" />
                    <div className="absolute w-12 h-12 rounded-full border border-dashed border-adcc-accent/35 animate-spin" style={{ animationDuration: '8s' }} />
                    {/* Radar swept line */}
                    <div className="absolute top-1/2 left-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent to-adcc-accent origin-left animate-spin" style={{ animationDuration: '4s' }} />
                    <span className="absolute bottom-1 right-2 text-[8px] text-adcc-accent font-bold uppercase tracking-wider">SAT-REC SCAN // TARGET LOCK</span>
                    <span className="absolute top-1 left-2 text-[8px] text-adcc-textMuted font-bold uppercase tracking-wider">RESOLVING 3D TERRAIN...</span>
                  </div>

                  {/* Coordinates Info */}
                  <div className="grid grid-cols-2 gap-2 bg-adcc-surface2/60 border border-adcc-border p-2.5 rounded-xl text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-adcc-textMuted uppercase text-[8px]">LATITUDE</span>
                      <span className="text-adcc-textPrimary font-semibold">{selectedEntity.data.latitude?.toFixed(4) ?? '--'}° N</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-adcc-textMuted uppercase text-[8px]">LONGITUDE</span>
                      <span className="text-adcc-textPrimary font-semibold">{selectedEntity.data.longitude?.toFixed(4) ?? '--'}° E</span>
                    </div>
                  </div>

                  {/* Detailed Specs based on category */}
                  {selectedEntity.type === 'disaster' && (
                    <div className="space-y-2.5 mt-2">
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Operational Region:</span>
                        <span className="font-semibold text-adcc-textPrimary flex items-center gap-1">
                          {(selectedEntity.data as BackendDisaster).country === 'USA' ? '🇺🇸 United States' : '🇮🇳 India'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Telemetry Ingest:</span>
                        <span className="font-semibold text-adcc-accent">{(selectedEntity.data as BackendDisaster).source || 'NOAA / GDACS'}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Hazard Type:</span>
                        <span className="font-semibold text-adcc-textPrimary">{(selectedEntity.data as BackendDisaster).disaster_type}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Severity:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityBadgeColor((selectedEntity.data as BackendDisaster).severity)}`}>
                          {(selectedEntity.data as BackendDisaster).severity}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Affected Citizens:</span>
                        <span className="font-bold text-adcc-textPrimary">{(selectedEntity.data as BackendDisaster).affected_population?.toLocaleString() ?? 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Confidence Rating:</span>
                        <span className="text-adcc-accent">{(selectedEntity.data as BackendDisaster).confidence_score ? `${Math.round((selectedEntity.data as BackendDisaster).confidence_score! * 100)}%` : '--'}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Verification Status:</span>
                        <span className="text-adcc-success">{(selectedEntity.data as BackendDisaster).verification_status}</span>
                      </div>
                    </div>
                  )}

                  {selectedEntity.type === 'hospital' && (
                    <div className="space-y-2.5 mt-2">
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Operational Region:</span>
                        <span className="font-semibold text-adcc-textPrimary">
                          {(selectedEntity.data as BackendHospital).country === 'USA' ? '🇺🇸 USA' : '🇮🇳 India'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">City Location:</span>
                        <span className="font-semibold text-adcc-textPrimary">{(selectedEntity.data as BackendHospital).city}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Available Beds:</span>
                        <span className="font-bold text-adcc-success">{(selectedEntity.data as BackendHospital).available_beds} slots</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Total Bed Capacity:</span>
                        <span className="text-adcc-textPrimary">{(selectedEntity.data as BackendHospital).total_beds} slots</span>
                      </div>
                    </div>
                  )}

                  {selectedEntity.type === 'shelter' && (
                    <div className="space-y-2.5 mt-2">
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Operational Region:</span>
                        <span className="font-semibold text-adcc-textPrimary">
                          {(selectedEntity.data as BackendShelter).country === 'USA' ? '🇺🇸 USA' : '🇮🇳 India'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">City Location:</span>
                        <span className="font-semibold text-adcc-textPrimary">{(selectedEntity.data as BackendShelter).city}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Occupied Slots:</span>
                        <span className="font-bold text-adcc-warning">{(selectedEntity.data as BackendShelter).occupied} citizens</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Vacant Capacity:</span>
                        <span className="font-bold text-adcc-success">
                          {Math.max(0, (selectedEntity.data as BackendShelter).capacity - (selectedEntity.data as BackendShelter).occupied)} slots
                        </span>
                      </div>
                      
                      {/* Occupancy Index Progress Bar */}
                      <div className="flex flex-col gap-1.5 mt-1 border-b border-adcc-border pb-3">
                        <span className="text-adcc-textMuted uppercase text-[8px] font-bold tracking-wider">Occupancy Index:</span>
                        <div className="w-full bg-adcc-surface2 rounded-full h-3.5 border border-adcc-border overflow-hidden relative">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round(((selectedEntity.data as BackendShelter).occupied / (selectedEntity.data as BackendShelter).capacity) * 100))}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-extrabold text-adcc-textPrimary font-mono">
                            {Math.round(((selectedEntity.data as BackendShelter).occupied / (selectedEntity.data as BackendShelter).capacity) * 100)}% OCCUPIED
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Total Volume:</span>
                        <span className="text-adcc-textPrimary">{(selectedEntity.data as BackendShelter).capacity} slots</span>
                      </div>
                    </div>
                  )}

                  {selectedEntity.type === 'resource' && (
                    <div className="space-y-2.5 mt-2">
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Fleet Region:</span>
                        <span className="font-semibold text-adcc-textPrimary flex items-center gap-1">
                          {(selectedEntity.data as BackendResource).country === 'USA' ? '🇺🇸 United States' : '🇮🇳 India'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Equipment Type:</span>
                        <span className="font-semibold text-adcc-textPrimary">{(selectedEntity.data as BackendResource).resource_type.replace('_', ' ')}</span>
                      </div>
                      {(selectedEntity.data as BackendResource).model_spec && (
                        <div className="flex justify-between border-b border-adcc-border pb-1.5">
                          <span className="text-adcc-textMuted">Model / Spec:</span>
                          <span className="font-semibold text-cyan-400">{(selectedEntity.data as BackendResource).model_spec}</span>
                        </div>
                      )}
                      {(selectedEntity.data as BackendResource).capabilities && (
                        <div className="flex justify-between border-b border-adcc-border pb-1.5">
                          <span className="text-adcc-textMuted">Capabilities:</span>
                          <span className="font-medium text-adcc-textPrimary text-[10px]">{(selectedEntity.data as BackendResource).capabilities}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Current Status:</span>
                        <span className={`font-bold ${
                          (selectedEntity.data as BackendResource).status === 'Available' ? 'text-adcc-success' : 'text-adcc-warning'
                        }`}>
                          {(selectedEntity.data as BackendResource).status}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Reserves Quantity:</span>
                        <span className="font-bold text-adcc-textPrimary">{(selectedEntity.data as BackendResource).quantity} units</span>
                      </div>
                      {(selectedEntity.data as BackendResource).contact_name && (
                        <div className="flex justify-between border-b border-adcc-border pb-1.5">
                          <span className="text-adcc-textMuted">Unit Commander:</span>
                          <span className="font-semibold text-adcc-textPrimary">{(selectedEntity.data as BackendResource).contact_name}</span>
                        </div>
                      )}
                      {(selectedEntity.data as BackendResource).contact_phone && (
                        <div className="flex justify-between border-b border-adcc-border pb-1.5">
                          <span className="text-adcc-textMuted">Direct Line:</span>
                          <a 
                            href={`tel:${(selectedEntity.data as BackendResource).contact_phone}`} 
                            className="font-bold text-adcc-accent hover:underline flex items-center gap-1"
                          >
                            <Phone size={10} /> {(selectedEntity.data as BackendResource).contact_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEntity.type === 'route' && (
                    <div className="space-y-3 mt-2">
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Dispatched Asset:</span>
                        <span className="font-bold text-adcc-textPrimary">{(selectedEntity.data as any).resourceName}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Disaster Incident:</span>
                        <span className="font-bold text-adcc-textPrimary">{(selectedEntity.data as any).disasterTitle}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Distance / Transit:</span>
                        <span className="font-bold text-adcc-accent">
                          {(selectedEntity.data as any).distanceKm.toFixed(1)} km ({((selectedEntity.data as any).distanceKm * 0.621371).toFixed(1)} mi)
                        </span>
                      </div>
                      
                      {/* ETA Sparkline Index */}
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Response ETA:</span>
                        <span className="font-bold text-green-400">~{Math.round((selectedEntity.data as any).distanceKm / 45)} mins</span>
                      </div>

                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-textMuted">Transit Corridor:</span>
                        <span className="font-bold text-adcc-warning">{(selectedEntity.data as any).routeSteps.routeName}</span>
                      </div>
                      <div className="flex justify-between border-b border-adcc-border pb-1.5">
                        <span className="text-adcc-success uppercase">{(selectedEntity.data as any).status}</span>
                      </div>
                      {(selectedEntity.data as any).contact_phone && (
                        <div className="flex justify-between border-b border-adcc-border pb-1.5">
                          <span className="text-adcc-textMuted">Responder Phone:</span>
                          <a 
                            href={`tel:${(selectedEntity.data as any).contact_phone}`} 
                            className="font-bold text-adcc-accent hover:underline flex items-center gap-1"
                          >
                            <Phone size={10} /> {(selectedEntity.data as any).contact_phone}
                          </a>
                        </div>
                      )}
                      {(selectedEntity.data as any).issue_description && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-[10px]">
                          <span className="font-bold uppercase tracking-wider block mb-1">⚠️ Field Impediment Reported:</span>
                          {(selectedEntity.data as any).issue_description}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-adcc-textMuted uppercase text-[8px] font-bold tracking-wider">Tactical Routing Waypoints:</span>
                        <div className="p-2.5 bg-adcc-secondary/40 border border-adcc-border rounded-lg flex flex-col gap-2 text-[10px] leading-relaxed font-sans">
                          {(selectedEntity.data as any).routeSteps.steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex gap-1.5">
                              <span className="text-adcc-accent font-bold font-mono">{idx + 1}.</span>
                              <span className="text-adcc-textPrimary">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-adcc-textMuted uppercase text-[8px] font-bold tracking-wider">Deployment Dispatch Logic:</span>
                        <div className="p-3 bg-adcc-accent/5 border border-adcc-accent/25 rounded-lg text-adcc-textPrimary italic text-[11px] leading-relaxed">
                          "{(selectedEntity.data as any).allocation_reason || 'Manual override deployment registered.'}"
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GIS Action Control Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-adcc-border">
                    <button
                      type="button"
                      onClick={() => alert(`Initiating tactical dispatch to coordinates: ${selectedEntity.data.latitude?.toFixed(3)}, ${selectedEntity.data.longitude?.toFixed(3)}`)}
                      className="px-1.5 py-2 bg-adcc-accentDim hover:bg-adcc-accent hover:text-adcc-bg text-[10px] font-bold uppercase tracking-wider rounded-lg border border-adcc-accentBorder transition-all duration-200 cursor-pointer text-center"
                    >
                      Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Broadcasting emergency cellular alert payloads.`)}
                      className="px-1.5 py-2 bg-adcc-danger/10 hover:bg-adcc-danger hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-adcc-danger/35 transition-all duration-200 cursor-pointer text-center"
                    >
                      Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Re-optimizing network dispatch parameters.`)}
                      className="px-1.5 py-2 bg-adcc-surface2 hover:bg-adcc-accent hover:text-adcc-bg text-[10px] font-bold uppercase tracking-wider rounded-lg border border-adcc-border transition-all duration-200 cursor-pointer text-center"
                    >
                      Route
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-adcc-border rounded-2xl text-[11px] font-mono text-adcc-textMuted p-4 text-center">
                  <MapPin size={24} className="text-adcc-accent" />
                  <span>SELECT PIN ON TACTICAL GRID FOR SATELLITE DIAGNOSTICS OVERLAYS</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
export default DisasterMap;
