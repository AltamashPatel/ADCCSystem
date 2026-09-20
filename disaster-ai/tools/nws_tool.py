"""
ADCC — NOAA / National Weather Service (NWS) Active Alerts Tool
==============================================================
Fetches real-time, official US weather and disaster alerts directly from 
the US National Weather Service (NOAA) API:
    https://api.weather.gov/alerts/active

No API key required.
Includes:
    - Flash Floods, Coastal Floods, River Floods
    - Tropical Storms, Hurricanes
    - Wildfires, Red Flag Warnings
    - Tornadoes, Severe Thunderstorms
"""

import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import requests
from loguru import logger
from pydantic import BaseModel, Field

NWS_ALERTS_URL = "https://api.weather.gov/alerts/active"
HEADERS = {
    "User-Agent": "(ADCC-Command-Center, admin@adcc.local)",
    "Accept": "application/geo+json"
}
TIMEOUT = 12

SEVERITY_MAP = {
    "Extreme": "Critical",
    "Severe": "High",
    "Moderate": "Medium",
    "Minor": "Low",
    "Unknown": "Medium",
}


class NWSEvent(BaseModel):
    event_id: str
    event_type: str
    severity_mapped: str
    title: str
    description: Optional[str] = None
    area_desc: str
    latitude: float
    longitude: float
    affected_population: Optional[int] = 25000
    source: str = "NWS NOAA"
    source_url: str
    country: str = "USA"
    event_date: Optional[str] = None


def _calculate_centroid(geometry: Optional[Dict[str, Any]]) -> Optional[tuple[float, float]]:
    """Calculates approximate (lat, lon) centroid from GeoJSON geometry."""
    if not geometry:
        return None
    g_type = geometry.get("type")
    coords = geometry.get("coordinates")
    if not coords:
        return None

    try:
        if g_type == "Point":
            return float(coords[1]), float(coords[0])
        elif g_type == "Polygon":
            # coords is list of linear rings: [[[lon, lat], [lon, lat], ...]]
            ring = coords[0]
            if not ring:
                return None
            avg_lon = sum(pt[0] for pt in ring) / len(ring)
            avg_lat = sum(pt[1] for pt in ring) / len(ring)
            return avg_lat, avg_lon
        elif g_type == "MultiPolygon":
            # Flatten first polygon
            poly = coords[0]
            ring = poly[0]
            if not ring:
                return None
            avg_lon = sum(pt[0] for pt in ring) / len(ring)
            avg_lat = sum(pt[1] for pt in ring) / len(ring)
            return avg_lat, avg_lon
    except Exception as e:
        logger.debug(f"Error calculating centroid: {e}")
        return None
    return None


def get_active_usa_disasters(limit: int = 40) -> List[NWSEvent]:
    """
    Fetches real-time active disaster alerts across the United States.
    Filters for Floods, Cyclones/Hurricanes, Wildfires, Tornadoes with valid coordinates.
    """
    logger.info(f"[NWSTool] Fetching live USA disasters from NOAA NWS API (limit={limit})...")
    events: List[NWSEvent] = []

    try:
        resp = requests.get(NWS_ALERTS_URL, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code != 200:
            logger.warning(f"[NWSTool] NWS returned HTTP {resp.status_code}")
            return events

        data = resp.json()
        features = data.get("features", [])
        logger.info(f"[NWSTool] Received {len(features)} total alerts from NWS. Filtering for severe hazards...")

        # Keywords of interest
        disaster_keywords = [
            "flood", "flash flood", "hurricane", "tropical storm", 
            "wildfire", "red flag", "tornado", "coastal flood"
        ]

        count = 0
        for feat in features:
            if count >= limit:
                break

            props = feat.get("properties", {})
            event_name = props.get("event", "")
            event_lower = event_name.lower()

            if not any(k in event_lower for k in disaster_keywords):
                continue

            # Check geometry
            centroid = _calculate_centroid(feat.get("geometry"))
            if not centroid:
                continue

            lat, lon = centroid
            
            # Map event type
            mapped_type = "Flood"
            if "hurricane" in event_lower or "tropical storm" in event_lower or "cyclone" in event_lower:
                mapped_type = "Cyclone"
            elif "wildfire" in event_lower or "red flag" in event_lower or "fire" in event_lower:
                mapped_type = "Wildfire"
            elif "tornado" in event_lower or "wind" in event_lower:
                mapped_type = "Cyclone"
            elif "flood" in event_lower:
                mapped_type = "Flood"

            raw_severity = props.get("severity", "Moderate")
            adcc_severity = SEVERITY_MAP.get(raw_severity, "Medium")

            event_id = props.get("id") or feat.get("id", f"nws-{count}")
            headline = props.get("headline") or f"{event_name} in {props.get('areaDesc', 'USA')}"
            desc = props.get("description") or headline
            area_desc = props.get("areaDesc") or "USA"

            events.append(NWSEvent(
                event_id=str(event_id),
                event_type=mapped_type,
                severity_mapped=adcc_severity,
                title=f"{event_name}: {area_desc.split(';')[0][:60]}",
                description=desc[:500],
                area_desc=area_desc,
                latitude=round(lat, 4),
                longitude=round(lon, 4),
                affected_population=45000 if adcc_severity in ["Critical", "High"] else 15000,
                source=f"NOAA NWS ({props.get('senderName', 'National Weather Service')[:40]})",
                source_url=props.get("@id") or f"https://alerts.weather.gov",
                country="USA",
                event_date=props.get("sent") or datetime.now(timezone.utc).isoformat()
            ))
            count += 1

        logger.info(f"[NWSTool] Successfully parsed {len(events)} active USA disaster events.")
        return events

    except Exception as e:
        logger.error(f"[NWSTool] Failed to fetch NWS alerts: {e}")
        return []
