import { BackendDisaster } from '../services/api';

/**
 * Curated real-world high-resolution disaster photography (Unsplash CDN).
 * Provides authentic imagery mapped to specific disaster incidents and fallbacks by disaster type.
 */
export const DISASTER_IMAGES: Record<string, string> = {
  // Specific Real-World Scenarios
  topanga: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', // California wildfire
  california: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
  milton: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80', // Florida hurricane & storm surge
  florida: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
  houston: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80', // Texas submerged highway & bayou flood
  texas: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
  alaska: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1200&q=80', // Alaska seismic terrain fissure
  cook_inlet: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1200&q=80',
  mojave: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80', // Nevada blistering heatwave
  nevada: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
  maui: 'https://images.unsplash.com/photo-1599578705716-8d3e98b0416b?auto=format&fit=crop&w=1200&q=80', // Maui wildfire ridge
  hawaii: 'https://images.unsplash.com/photo-1599578705716-8d3e98b0416b?auto=format&fit=crop&w=1200&q=80',
  mumbai: 'https://images.unsplash.com/photo-1628087235619-354359877dfb?auto=format&fit=crop&w=1200&q=80', // Mumbai urban monsoon flood
  mithi: 'https://images.unsplash.com/photo-1628087235619-354359877dfb?auto=format&fit=crop&w=1200&q=80',
  tauktae: 'https://images.unsplash.com/photo-1508873696983-2df5703bc225?auto=format&fit=crop&w=1200&q=80', // Cyclone swirl in ocean
  arabian_sea: 'https://images.unsplash.com/photo-1508873696983-2df5703bc225?auto=format&fit=crop&w=1200&q=80',
  assam: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80', // Assam Brahmaputra river deluge
  brahmaputra: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
  delhi: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Delhi extreme heatwave
  chamoli: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80', // Chamoli mountain gorge flash flood
  uttarakhand: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',

  // Type Fallbacks
  wildfire: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80',
  cyclone: 'https://images.unsplash.com/photo-1561553873-e8491a564fd0?auto=format&fit=crop&w=1200&q=80',
  hurricane: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
  flood: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
  earthquake: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80',
  heatwave: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80',
  landslide: 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1508873696983-2df5703bc225?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Resolves the best available online photo for a given disaster
 */
export const getDisasterImage = (disaster: BackendDisaster): string => {
  const titleLower = disaster.title.toLowerCase();
  
  // 1. Check title keywords
  for (const [key, url] of Object.entries(DISASTER_IMAGES)) {
    if (titleLower.includes(key)) {
      return url;
    }
  }

  // 2. Check disaster type
  const typeKey = disaster.disaster_type?.toLowerCase();
  if (typeKey && DISASTER_IMAGES[typeKey]) {
    return DISASTER_IMAGES[typeKey];
  }

  // 3. Fallback
  return DISASTER_IMAGES.default;
};
