"""
ADCC — Database Seed Data
==========================
Populates the database with realistic disaster, resource, robotics, hospital, and shelter data
for both the United States and India.

Run this script directly:
    python -m database.seed_data --reset
"""

import sys
import uuid
from datetime import datetime, timedelta, timezone

from loguru import logger

from database.postgres import SessionLocal, create_tables
from database.models import (
    Alert,
    AllocationStatus,
    ApiSyncLog,
    DataSource,
    DataSourceStatus,
    Disaster,
    DisasterStatus,
    DisasterType,
    Hospital,
    Resource,
    ResourceAllocation,
    ResourceStatus,
    ResourceType,
    SeverityLevel,
    Shelter,
    SimulationRun,
    SourceType,
    SyncStatus,
    VerificationLog,
    VerificationStatus,
)


def now() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return now() - timedelta(days=n)


def hours_ago(n: int) -> datetime:
    return now() - timedelta(hours=n)


# ===========================================================================
# DISASTERS — INDIA & USA
# ===========================================================================

DISASTERS = [
    # ── USA Disasters ─────────────────────────────────────────────────────────
    {
        "title": "California Wildfire — Los Angeles Canyon Complex",
        "disaster_type": DisasterType.WILDFIRE,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 34.1808, "longitude": -118.5353,
        "affected_population": 185000,
        "confidence_score": 0.96,
        "source": "CAL FIRE / InciWeb Incident #CA-VNC-001",
        "source_type": SourceType.MANUAL,
        "source_url": "https://www.fire.ca.gov/incidents",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": days_ago(1),
    },
    {
        "title": "Florida Hurricane Milton — Tampa Bay Inundation",
        "disaster_type": DisasterType.CYCLONE,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 27.9506, "longitude": -82.4572,
        "affected_population": 650000,
        "confidence_score": 0.98,
        "source": "NOAA National Hurricane Center Advisory #18",
        "source_type": SourceType.NWS,
        "source_url": "https://www.nhc.noaa.gov",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": days_ago(2),
    },
    {
        "title": "Texas Gulf Coast Flash Floods — Houston Bayou Surge",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.ACTIVE,
        "latitude": 29.7604, "longitude": -95.3698,
        "affected_population": 240000,
        "confidence_score": 0.92,
        "source": "NWS Houston Flash Flood Warning",
        "source_type": SourceType.NWS,
        "source_url": "https://api.weather.gov/alerts/active",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(2),
        "created_at": days_ago(1),
    },
    {
        "title": "Alaska Cook Inlet Earthquake M6.4",
        "disaster_type": DisasterType.EARTHQUAKE,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.ACTIVE,
        "latitude": 61.2181, "longitude": -149.9003,
        "affected_population": 85000,
        "confidence_score": 0.99,
        "source": "USGS EQ-2024-AK-701",
        "source_type": SourceType.USGS,
        "source_url": "https://earthquake.usgs.gov/earthquakes/eventpage/ak2024eq",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(3),
        "created_at": hours_ago(6),
    },
    {
        "title": "Nevada Mojave Severe Extreme Heatwave",
        "disaster_type": DisasterType.HEATWAVE,
        "severity": SeverityLevel.MEDIUM,
        "status": DisasterStatus.MONITORING,
        "latitude": 36.1699, "longitude": -115.1398,
        "affected_population": 420000,
        "confidence_score": 0.94,
        "source": "NWS Las Vegas Excessive Heat Warning",
        "source_type": SourceType.NWS,
        "source_url": "https://api.weather.gov",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(5),
        "created_at": days_ago(2),
    },
    {
        "title": "Maui Hawaii Wildfire Complex",
        "disaster_type": DisasterType.WILDFIRE,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.MONITORING,
        "latitude": 20.8893, "longitude": -156.4729,
        "affected_population": 35000,
        "confidence_score": 0.97,
        "source": "Hawaii Emergency Management Agency",
        "source_type": SourceType.MANUAL,
        "source_url": "https://dod.hawaii.gov/hiema",
        "country": "USA",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(4),
        "created_at": days_ago(4),
    },

    # ── India Floods ──────────────────────────────────────────────────────────
    {
        "title": "Mumbai Coastal Flooding — Mithi River Overflow",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 19.0760, "longitude": 72.8777,
        "affected_population": 450000,
        "confidence_score": 0.93,
        "source": "NDMA Alert #2024-MH-001",
        "source_type": SourceType.NDMA,
        "source_url": "https://ndma.gov.in/alerts/2024/MH-001",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(2),
        "created_at": days_ago(1),
    },
    {
        "title": "Assam Brahmaputra River Floods",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 26.1445, "longitude": 91.7362,
        "affected_population": 820000,
        "confidence_score": 0.96,
        "source": "GDACS FL-20240612-ASM",
        "source_type": SourceType.GDACS,
        "source_url": "https://www.gdacs.org/report.aspx?eventid=1234&eventtype=FL",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": days_ago(3),
    },
    {
        "title": "Bihar Ganga Plains Flash Flood",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.ACTIVE,
        "latitude": 25.5941, "longitude": 85.1376,
        "affected_population": 310000,
        "confidence_score": 0.88,
        "source": "NDMA Alert #2024-BR-002",
        "source_type": SourceType.NDMA,
        "source_url": "https://ndma.gov.in/alerts/2024/BR-002",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(3),
        "created_at": days_ago(2),
    },
    {
        "title": "Kerala Wayanad Flood & Inundation",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.ACTIVE,
        "latitude": 11.6854, "longitude": 76.1320,
        "affected_population": 125000,
        "confidence_score": 0.91,
        "source": "IMD Red Alert Kerala",
        "source_type": SourceType.NDMA,
        "source_url": "https://mausam.imd.gov.in",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(4),
        "created_at": days_ago(2),
    },
    {
        "title": "Uttarakhand Rishikesh Flash Flood",
        "disaster_type": DisasterType.FLOOD,
        "severity": SeverityLevel.MEDIUM,
        "status": DisasterStatus.ACTIVE,
        "latitude": 30.0869, "longitude": 78.2676,
        "affected_population": 45000,
        "confidence_score": 0.85,
        "source": "SDMA Uttarakhand Alert",
        "source_type": SourceType.NDMA,
        "source_url": "https://usdma.uk.gov.in",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(5),
        "created_at": days_ago(1),
    },

    # ── India Cyclones ────────────────────────────────────────────────────────
    {
        "title": "Cyclone Tauktae — Arabian Sea Shoreline",
        "disaster_type": DisasterType.CYCLONE,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 18.9220, "longitude": 72.8347,
        "affected_population": 750000,
        "confidence_score": 0.97,
        "source": "GDACS TC-20240610-TAUKTAE",
        "source_type": SourceType.GDACS,
        "source_url": "https://www.gdacs.org/report.aspx?eventid=1001&eventtype=TC",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": days_ago(1),
    },
    {
        "title": "Cyclone Yaas — Odisha Balasore",
        "disaster_type": DisasterType.CYCLONE,
        "severity": SeverityLevel.CRITICAL,
        "status": DisasterStatus.ACTIVE,
        "latitude": 21.4942, "longitude": 86.9319,
        "affected_population": 890000,
        "confidence_score": 0.96,
        "source": "GDACS TC-20240609-YAAS",
        "source_type": SourceType.GDACS,
        "source_url": "https://www.gdacs.org/report.aspx?eventid=1005&eventtype=TC",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": days_ago(2),
    },

    # ── India Earthquakes ─────────────────────────────────────────────────────
    {
        "title": "Gujarat Bhuj Earthquake M5.8",
        "disaster_type": DisasterType.EARTHQUAKE,
        "severity": SeverityLevel.HIGH,
        "status": DisasterStatus.ACTIVE,
        "latitude": 23.2419, "longitude": 69.6669,
        "affected_population": 180000,
        "confidence_score": 0.99,
        "source": "USGS EQ-20240612-001",
        "source_type": SourceType.USGS,
        "source_url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000ABCD",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(1),
        "created_at": hours_ago(8),
    },
    {
        "title": "Jammu Kashmir Earthquake M4.8",
        "disaster_type": DisasterType.EARTHQUAKE,
        "severity": SeverityLevel.MEDIUM,
        "status": DisasterStatus.MONITORING,
        "latitude": 34.0837, "longitude": 74.7973,
        "affected_population": 28000,
        "confidence_score": 0.95,
        "source": "USGS EQ-20240609-004",
        "source_type": SourceType.USGS,
        "source_url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000MNOP",
        "country": "India",
        "verification_status": VerificationStatus.VERIFIED,
        "last_verified_at": hours_ago(8),
        "created_at": days_ago(2),
    },
]


# ===========================================================================
# RESOURCES — ROBOTS, AMBULANCES, EVACUATION TEAMS, BOATS, MEDICAL
# ===========================================================================

RESOURCES = [
    # ── USA DISASTER MANAGEMENT ROBOTS (Dedicated Fleet) ──────────────────────
    {
        "resource_name": "Boston Dynamics Spot Recon Unit (Q-UGV)",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 37.7749, "longitude": -122.4194,  # San Francisco, CA
        "country": "USA",
        "contact_name": "Dr. Elena Rostova (Robotics Specialist)",
        "contact_phone": "+1 (415) 555-0188",
        "model_spec": "Boston Dynamics Spot Enterprise + Arm",
        "capabilities": "3D LiDAR SLAM, Gas & Radiation Sniffer, Unstable Rubble SAR, Confined Space Navigation"
    },
    {
        "resource_name": "Thermite RS3 Robotic Firefighting Vehicle",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 34.0522, "longitude": -118.2437,  # Los Angeles, CA (LAFD)
        "country": "USA",
        "contact_name": "Capt. Derek Miller (Fire Robotics)",
        "contact_phone": "+1 (213) 555-0192",
        "model_spec": "Textron / Howe & Howe Thermite RS3 Tracked UGV",
        "capabilities": "2,500 GPM Water/Foam Cannon, High-Temperature Steel Armor, Industrial & Wildfire Suppression"
    },
    {
        "resource_name": "Ghost Robotics Vision 60 (Q-UGV)",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 29.7604, "longitude": -95.3698,  # Houston, TX
        "country": "USA",
        "contact_name": "Spec. James Vance (Tactical Operator)",
        "contact_phone": "+1 (713) 555-0134",
        "model_spec": "Ghost Robotics Vision 60 All-Weather Quadruped",
        "capabilities": "IP67 Submersible, Rugged Rubble Traversal, Audio Survivor Detection, Night Recon"
    },
    {
        "resource_name": "Skydio X10 Autonomous SAR Drone Fleet",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 4,
        "latitude": 25.7617, "longitude": -80.1918,  # Miami, FL
        "country": "USA",
        "contact_name": "Chief Pilot Chloe Bennett",
        "contact_phone": "+1 (305) 555-0177",
        "model_spec": "Skydio X10 AI Autonomous Thermal Drone",
        "capabilities": "360° AI Obstacle Avoidance, FLIR Boson Radiometric Thermal, NightVision Survivor Tracking"
    },
    {
        "resource_name": "Teledyne FLIR Kobra Heavy Ground Robot",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 38.9072, "longitude": -77.0369,  # Washington DC / FEMA
        "country": "USA",
        "contact_name": "Sgt. Marcus Cole (EOD / Search)",
        "contact_phone": "+1 (202) 555-0149",
        "model_spec": "Teledyne FLIR Kobra 725 Heavy Breacher",
        "capabilities": "330 lb Mechanical Arm Lift, Hydraulic Rubble Breacher, HazMat Toxic Sensor Array"
    },
    {
        "resource_name": "Deep Trekker DTG3 Submersible Search ROV",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 29.9511, "longitude": -90.0715,  # New Orleans, LA
        "country": "USA",
        "contact_name": "Ryan O'Connor (Marine Search Lead)",
        "contact_phone": "+1 (504) 555-0163",
        "model_spec": "Deep Trekker DTG3 Commercial Underwater Drone",
        "capabilities": "Submerged Floodway Sonar Mapping, 4K Low-Light Optics, Grabber Arm Recovery"
    },
    {
        "resource_name": "Shark Robotics Colossus Support Unit",
        "resource_type": ResourceType.ROBOT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 40.7128, "longitude": -74.0060,  # New York, NY
        "country": "USA",
        "contact_name": "Operator Sarah Jensen",
        "contact_phone": "+1 (212) 555-0158",
        "model_spec": "Shark Robotics Colossus Heavy Electric Crawler",
        "capabilities": "Casualty Evacuation (1100 lbs stretcher), High-Pressure Fog Ventilation, Structure Stabilization"
    },

    # ── USA AMBULANCES ────────────────────────────────────────────────────────
    {
        "resource_name": "FDNY Tactical ALS Ambulance 04",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 40.7128, "longitude": -74.0060,
        "country": "USA",
        "contact_name": "Paramedic Sarah Jenkins",
        "contact_phone": "+1 (212) 555-0112",
        "model_spec": "Ford F-450 Type I 4x4 Super Duty Mobile ICU",
        "capabilities": "Advanced Cardiac Life Support, Mobile Telemetry, Ventilator Systems"
    },
    {
        "resource_name": "AMR Critical Care Transport LA-1",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 34.0522, "longitude": -118.2437,
        "country": "USA",
        "contact_name": "Paramedic David Kim",
        "contact_phone": "+1 (310) 555-0145",
        "model_spec": "Freightliner M2 Heavy Rescue Ambulance",
        "capabilities": "Trauma Surgical Transport, ECMO Capability, Critical Patient Transport"
    },
    {
        "resource_name": "Boston EMS Paramedic Rescue 4",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 42.3601, "longitude": -71.0589,
        "country": "USA",
        "contact_name": "Paramedic Tom Walsh",
        "contact_phone": "+1 (617) 555-0182",
        "model_spec": "Dodge Ram 4500 Tactical EMS Ambulance",
        "capabilities": "Rapid Urban Trauma Response, Defibrillator, Airway Management"
    },
    {
        "resource_name": "Miami-Dade Fire Rescue ALS Unit 12",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 25.7617, "longitude": -80.1918,
        "country": "USA",
        "contact_name": "Paramedic Maria Santos",
        "contact_phone": "+1 (305) 555-0199",
        "model_spec": "Type III Advanced Cardiac Life Support Ambulance",
        "capabilities": "Hurricane Storm Preparedness, Flood Evac Life Support"
    },

    # ── USA EVACUATION TEAMS ──────────────────────────────────────────────────
    {
        "resource_name": "FEMA CA-TF1 Urban Search & Evacuation Unit",
        "resource_type": ResourceType.EVACUATION_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 30,
        "latitude": 34.0522, "longitude": -118.2437,
        "country": "USA",
        "contact_name": "Commander Robert Hayes",
        "contact_phone": "+1 (213) 555-0160",
        "model_spec": "FEMA Type 1 Urban Search & Evacuation Task Force",
        "capabilities": "Canine Search, Concrete Breaching, Mass Evacuation Orchestration"
    },
    {
        "resource_name": "Texas Task Force 1 Swiftwater Evacuation Wing",
        "resource_type": ResourceType.EVACUATION_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 25,
        "latitude": 29.7604, "longitude": -95.3698,
        "country": "USA",
        "contact_name": "Capt. Travis Boone",
        "contact_phone": "+1 (713) 555-0172",
        "model_spec": "Swiftwater & Flood Evacuation Specialist Unit",
        "capabilities": "High-Water Rescue, Mass Citizen Evacuation, Airborne Sling Hoist"
    },
    {
        "resource_name": "Florida National Guard 124th Evacuation Wing",
        "resource_type": ResourceType.EVACUATION_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 40,
        "latitude": 28.5383, "longitude": -81.3792,
        "country": "USA",
        "contact_name": "Major Linda Ross",
        "contact_phone": "+1 (407) 555-0155",
        "model_spec": "High-Water Tactical Evacuation Troop",
        "capabilities": "High-Clearance Transport, Barrier Clearing, Shelter Conveyance"
    },

    # ── INDIA RESOURCES ───────────────────────────────────────────────────────
    # Boats
    {
        "resource_name": "NDRF Rescue Boat MH-01",
        "resource_type": ResourceType.BOAT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 19.0760, "longitude": 72.8777,
        "country": "India",
        "contact_name": "Sub-Inspector Rajesh Patil",
        "contact_phone": "+91 98201-11223",
        "model_spec": "Zodiac Milpro Grand Raid Inflatable (40 HP)",
        "capabilities": "Floodwaters Search & Extraction, Shallow Draft"
    },
    {
        "resource_name": "NDRF Rescue Boat MH-02",
        "resource_type": ResourceType.BOAT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 19.0596, "longitude": 72.8656,
        "country": "India",
        "contact_name": "Havildar Amit Shinde",
        "contact_phone": "+91 98201-11224",
        "model_spec": "Fiberglass Flood Rescue Vessel",
        "capabilities": "Urban Waterlogging Rescue"
    },
    {
        "resource_name": "SDRF Flood Boat WB-01",
        "resource_type": ResourceType.BOAT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 2,
        "latitude": 22.5726, "longitude": 88.3639,
        "country": "India",
        "contact_name": "Officer Subir Ghosh",
        "contact_phone": "+91 98301-44556",
        "model_spec": "SDRF Inflatable River Craft",
        "capabilities": "River Basin Evacuation"
    },
    {
        "resource_name": "River Rescue Boat OR-01",
        "resource_type": ResourceType.BOAT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 4,
        "latitude": 20.4625, "longitude": 85.8830,
        "country": "India",
        "contact_name": "Commander Bikram Das",
        "contact_phone": "+91 94370-88990",
        "model_spec": "Heavy Duty River Patrol Vessel",
        "capabilities": "Mahanadi Inundation Evacuation"
    },

    # Ambulances (India)
    {
        "resource_name": "CATS Emergency Ambulance MH-001",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 19.0760, "longitude": 72.8777,
        "country": "India",
        "contact_name": "Paramedic Dr. Anjali Deshmukh",
        "contact_phone": "+91 98201-33445",
        "model_spec": "Tata Winger ALS Intensive Care Ambulance",
        "capabilities": "Defibrillator, Oxygen Cylinder, Multi-para Monitor"
    },
    {
        "resource_name": "108 Emergency Ambulance DL-001",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 28.6139, "longitude": 77.2090,
        "country": "India",
        "contact_name": "Paramedic Harish Rawat",
        "contact_phone": "+91 98111-22334",
        "model_spec": "Force Motors Traveller ALS Unit",
        "capabilities": "Emergency Trauma Support, Stretcher Lift"
    },
    {
        "resource_name": "108 Ambulance KA-001",
        "resource_type": ResourceType.AMBULANCE,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 1,
        "latitude": 12.9716, "longitude": 77.5946,
        "country": "India",
        "contact_name": "Paramedic Suresh Gowda",
        "contact_phone": "+91 98450-99887",
        "model_spec": "Force Traveller Emergency Cardiac Unit",
        "capabilities": "Cardiac Telemetry, Trauma Extraction"
    },

    # Evacuation Teams & NDRF Units (India)
    {
        "resource_name": "NDRF 5th Battalion Unit-A",
        "resource_type": ResourceType.NDRF_UNIT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 45,
        "latitude": 18.5204, "longitude": 73.8567,
        "country": "India",
        "contact_name": "Commandant R. K. Verma",
        "contact_phone": "+91 94220-11223",
        "model_spec": "NDRF Specialized Heavy Disaster Battalion",
        "capabilities": "Deep Water Rescue, Collapse Search, Mass Evacuation"
    },
    {
        "resource_name": "NDRF 8th Battalion Unit-B",
        "resource_type": ResourceType.NDRF_UNIT,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 45,
        "latitude": 28.6139, "longitude": 77.2090,
        "country": "India",
        "contact_name": "Deputy Commandant Manoj Yadav",
        "contact_phone": "+91 94120-77665",
        "model_spec": "NDRF Urban SAR Battalion",
        "capabilities": "Debris Removal, Canine Unit, Rapid Evacuation"
    },
    {
        "resource_name": "NDRF Medical Team MH-Alpha",
        "resource_type": ResourceType.MEDICAL_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 12,
        "latitude": 19.0760, "longitude": 72.8777,
        "country": "India",
        "contact_name": "Dr. Pradeep Kulkarni",
        "contact_phone": "+91 98205-66778",
        "model_spec": "Field Surgical Emergency Team",
        "capabilities": "Triage, Mass Casualty Wound Care"
    },
    {
        "resource_name": "SDRF Rescue Team WB-1",
        "resource_type": ResourceType.RESCUE_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 25,
        "latitude": 22.5726, "longitude": 88.3639,
        "country": "India",
        "contact_name": "Captain Tanmoy Sen",
        "contact_phone": "+91 98310-55443",
        "model_spec": "State Disaster Rapid Action Force",
        "capabilities": "Flood Embankment Rescue, Cyclone Relief"
    },
    {
        "resource_name": "Indian Coastal Evacuation Team MH-1",
        "resource_type": ResourceType.EVACUATION_TEAM,
        "status": ResourceStatus.AVAILABLE,
        "quantity": 20,
        "latitude": 18.9220, "longitude": 72.8347,
        "country": "India",
        "contact_name": "Inspector Anand Rao",
        "contact_phone": "+91 98202-33441",
        "model_spec": "Coast Guard Shoreline Evacuation Force",
        "capabilities": "High-Tide Citizen Evacuation, Safe Zone Transport"
    },
]


# ===========================================================================
# HOSPITALS — USA & INDIA
# ===========================================================================

HOSPITALS = [
    # USA Hospitals
    {"name": "Cedars-Sinai Medical Center", "city": "Los Angeles, CA", "total_beds": 886, "available_beds": 145, "latitude": 34.0754, "longitude": -118.3807},
    {"name": "Massachusetts General Hospital", "city": "Boston, MA", "total_beds": 1011, "available_beds": 190, "latitude": 42.3631, "longitude": -71.0686},
    {"name": "Johns Hopkins Hospital", "city": "Baltimore, MD", "total_beds": 1162, "available_beds": 210, "latitude": 39.2974, "longitude": -76.5929},
    {"name": "Houston Methodist / Texas Medical Center", "city": "Houston, TX", "total_beds": 1050, "available_beds": 175, "latitude": 29.7107, "longitude": -95.3971},
    {"name": "Bellevue Hospital Center", "city": "New York, NY", "total_beds": 844, "available_beds": 130, "latitude": 40.7397, "longitude": -73.9754},
    {"name": "Jackson Memorial Hospital", "city": "Miami, FL", "total_beds": 1550, "available_beds": 260, "latitude": 25.7907, "longitude": -80.2104},
    {"name": "UCSF Medical Center", "city": "San Francisco, CA", "total_beds": 785, "available_beds": 115, "latitude": 37.7631, "longitude": -122.4578},

    # India Hospitals
    {"name": "KEM Hospital", "city": "Mumbai", "total_beds": 1800, "available_beds": 320, "latitude": 19.0018, "longitude": 72.8425},
    {"name": "Nair Hospital", "city": "Mumbai", "total_beds": 1200, "available_beds": 210, "latitude": 19.0037, "longitude": 72.8379},
    {"name": "Sion Hospital", "city": "Mumbai", "total_beds": 1500, "available_beds": 280, "latitude": 19.0440, "longitude": 72.8647},
    {"name": "AIIMS Delhi", "city": "Delhi", "total_beds": 2478, "available_beds": 410, "latitude": 28.5672, "longitude": 77.2100},
    {"name": "Safdarjung Hospital", "city": "Delhi", "total_beds": 1531, "available_beds": 265, "latitude": 28.5676, "longitude": 77.2060},
    {"name": "Sassoon General Hospital", "city": "Pune", "total_beds": 1400, "available_beds": 230, "latitude": 18.5204, "longitude": 73.8567},
    {"name": "Victoria Hospital Bengaluru", "city": "Bengaluru", "total_beds": 1300, "available_beds": 198, "latitude": 12.9716, "longitude": 77.5946},
    {"name": "Rajiv Gandhi Government General Hospital", "city": "Chennai", "total_beds": 2700, "available_beds": 450, "latitude": 13.0827, "longitude": 80.2707},
    {"name": "Gandhi Hospital Hyderabad", "city": "Hyderabad", "total_beds": 1900, "available_beds": 310, "latitude": 17.4065, "longitude": 78.4772},
    {"name": "SSKM Hospital Kolkata", "city": "Kolkata", "total_beds": 2100, "available_beds": 340, "latitude": 22.5392, "longitude": 88.3426},
]


# ===========================================================================
# SHELTERS — USA & INDIA
# ===========================================================================

SHELTERS = [
    # USA Shelters
    {"name": "NRG Stadium Evacuation Mega-Shelter", "city": "Houston, TX", "capacity": 12000, "occupied": 2400, "latitude": 29.6847, "longitude": -95.4107},
    {"name": "Los Angeles Convention Center Relief Hub", "city": "Los Angeles, CA", "capacity": 8500, "occupied": 1200, "latitude": 34.0407, "longitude": -118.2694},
    {"name": "Orange County Convention Shelter Hub", "city": "Orlando, FL", "capacity": 10000, "occupied": 3100, "latitude": 28.4277, "longitude": -81.4704},
    {"name": "Pier 36 Emergency Evacuation Center", "city": "New York, NY", "capacity": 3500, "occupied": 450, "latitude": 40.7099, "longitude": -73.9852},

    # India Shelters
    {"name": "Dharavi Municipal Relief Camp", "city": "Mumbai", "capacity": 5000, "occupied": 2100, "latitude": 19.0434, "longitude": 72.8562},
    {"name": "Kurla Relief Center", "city": "Mumbai", "capacity": 3000, "occupied": 1450, "latitude": 19.0657, "longitude": 72.8794},
    {"name": "Thyagaraj Stadium Emergency Shelter", "city": "Delhi", "capacity": 8000, "occupied": 1200, "latitude": 28.5794, "longitude": 77.2166},
    {"name": "Salt Lake Stadium Relief Camp", "city": "Kolkata", "capacity": 15000, "occupied": 4200, "latitude": 22.5697, "longitude": 88.4069},
    {"name": "Kanteerava Indoor Stadium Shelter", "city": "Bengaluru", "capacity": 6000, "occupied": 850, "latitude": 12.9698, "longitude": 77.5926},
    {"name": "Jawaharlal Nehru Stadium Shelter", "city": "Chennai", "capacity": 10000, "occupied": 2300, "latitude": 13.0827, "longitude": 80.2785},
]


# ===========================================================================
# ALERTS
# ===========================================================================

ALERTS = [
    {
        "title": "Severe Flash Flood Warning — Los Angeles Canyon Corridors",
        "severity": SeverityLevel.CRITICAL,
        "message": "NWS Flash Flood Warning active for burn scar areas in LA Canyon zones. Evacuation teams and Boston Dynamics Spot deployed.",
        "source": "NOAA NWS Los Angeles",
        "source_type": SourceType.NWS,
        "source_url": "https://api.weather.gov/alerts/active",
        "confidence_score": 0.96,
        "created_at": hours_ago(1),
    },
    {
        "title": "Hurricane Milton Category 4 Rapid Intensification",
        "severity": SeverityLevel.CRITICAL,
        "message": "Dangerous storm surge approaching Tampa Bay coast. Lifeboats prohibited due to extreme winds. Evacuation teams on standby.",
        "source": "NOAA National Hurricane Center",
        "source_type": SourceType.NWS,
        "source_url": "https://www.nhc.noaa.gov",
        "confidence_score": 0.98,
        "created_at": hours_ago(2),
    },
    {
        "title": "Mithi River Approaching High Tide Danger Level",
        "severity": SeverityLevel.CRITICAL,
        "message": "Water levels at BKC bridge at 3.8m (danger mark 4.0m). Low-lying area evacuation in progress.",
        "source": "MCGM Disaster Management Cell",
        "source_type": SourceType.NDMA,
        "source_url": "https://ndma.gov.in/alerts/2024/MH-001",
        "confidence_score": 0.94,
        "created_at": hours_ago(1),
    },
    {
        "title": "Brahmaputra Flood Discharge Exceeds 25,000 m³/s",
        "severity": SeverityLevel.CRITICAL,
        "message": "Central Water Commission reports severe flooding in 14 districts across Assam.",
        "source": "Central Water Commission",
        "source_type": SourceType.NDMA,
        "source_url": "https://cwc.gov.in/bulletins/2024-ASM-01",
        "confidence_score": 0.96,
        "created_at": hours_ago(2),
    },
    {
        "title": "Cyclone Tauktae Wind Warnings — Mumbai Coastline",
        "severity": SeverityLevel.HIGH,
        "message": "Wind gusts exceeding 110 km/h detected. Small vessel marine operations prohibited. Evacuation wings active.",
        "source": "IMD Mumbai Radar",
        "source_type": SourceType.NDMA,
        "source_url": "https://mausam.imd.gov.in",
        "confidence_score": 0.92,
        "created_at": hours_ago(3),
    },
]


# ===========================================================================
# DATA SOURCES
# ===========================================================================

DATA_SOURCES = [
    {"name": "NOAA National Weather Service", "source_type": SourceType.NWS, "base_url": "https://api.weather.gov", "status": DataSourceStatus.ACTIVE, "description": "Official US weather, flood, hurricane, and disaster alert API."},
    {"name": "USGS Earthquake Hazards Program", "source_type": SourceType.USGS, "base_url": "https://earthquake.usgs.gov/fdsnws/event/1", "status": DataSourceStatus.ACTIVE, "description": "Real-time global & US seismic activity feeds."},
    {"name": "GDACS Disaster Alert Feed", "source_type": SourceType.GDACS, "base_url": "https://www.gdacs.org/gdacsapi/api", "status": DataSourceStatus.ACTIVE, "description": "Global multi-hazard real-time disaster alerts."},
    {"name": "Open-Meteo Weather API", "source_type": SourceType.OPENMETEO, "base_url": "https://api.open-meteo.com/v1", "status": DataSourceStatus.ACTIVE, "description": "High-resolution precipitation and wind forecasts."},
    {"name": "NDMA Disaster Alert Network", "source_type": SourceType.NDMA, "base_url": "https://ndma.gov.in", "status": DataSourceStatus.ACTIVE, "description": "National Disaster Management Authority of India."},
]


# ===========================================================================
# SEED FUNCTIONS
# ===========================================================================

def seed_disasters(db) -> list:
    logger.info("Seeding disasters...")
    created = []
    for d in DISASTERS:
        disaster = Disaster(**d)
        db.add(disaster)
        created.append(disaster)
    db.flush()
    logger.info(f"  ✅ {len(created)} disasters inserted")
    return created


def seed_resources(db) -> list:
    logger.info("Seeding resources...")
    created = []
    for r in RESOURCES:
        resource = Resource(**r)
        db.add(resource)
        created.append(resource)
    db.flush()
    logger.info(f"  ✅ {len(created)} resources inserted")
    return created


def seed_hospitals(db) -> None:
    logger.info("Seeding hospitals...")
    for h in HOSPITALS:
        db.add(Hospital(**h))
    logger.info(f"  ✅ {len(HOSPITALS)} hospitals inserted")


def seed_shelters(db) -> None:
    logger.info("Seeding shelters...")
    for s in SHELTERS:
        db.add(Shelter(**s))
    logger.info(f"  ✅ {len(SHELTERS)} shelters inserted")


def seed_alerts(db) -> None:
    logger.info("Seeding alerts...")
    for a in ALERTS:
        db.add(Alert(**a))
    logger.info(f"  ✅ {len(ALERTS)} alerts inserted")


def seed_data_sources(db) -> None:
    logger.info("Seeding data sources...")
    for ds in DATA_SOURCES:
        db.add(DataSource(**ds))
    logger.info(f"  ✅ {len(DATA_SOURCES)} data sources inserted")


def seed_sample_allocations(db, disasters: list, resources: list) -> None:
    """
    Creates sample ResourceAllocation records demonstrating full human verification lifecycle:
    - DISPATCHED
    - REACHED
    - ISSUE_REPORTED
    - PENDING_APPROVAL
    """
    logger.info("Seeding realistic sample resource allocations with human verification states...")

    # Find specific targets
    cal_fire = next((d for d in disasters if "California" in d.title), disasters[0])
    fl_hurricane = next((d for d in disasters if "Milton" in d.title), disasters[1])
    mumbai_flood = next((d for d in disasters if "Mumbai" in d.title), disasters[0])
    gujarat_eq = next((d for d in disasters if "Gujarat" in d.title), disasters[-1])

    # Find specific resources
    thermite_robot = next((r for r in resources if "Thermite RS3" in r.resource_name), resources[1])
    spot_robot = next((r for r in resources if "Spot" in r.resource_name), resources[0])
    drone_robot = next((r for r in resources if "Skydio X10" in r.resource_name), resources[3])
    ndrf_boat = next((r for r in resources if "NDRF Rescue Boat MH-01" in r.resource_name), resources[-5])
    fdny_amb = next((r for r in resources if "FDNY Tactical" in r.resource_name), resources[7])

    sample_allocations = [
        # Allocation 1: Thermite RS3 Fire Robot dispatched to California Wildfire
        ResourceAllocation(
            disaster_id=cal_fire.id,
            resource_id=thermite_robot.id,
            quantity=1,
            allocation_reason="California Canyon Fire suppression: Thermite RS3 robotic water/foam cannon deployed to protect perimeter structures",
            status=AllocationStatus.DISPATCHED,
            distance_km=14.8,
            eta_minutes=20,
            route_name="US-101 North / Topanga Canyon Corridor",
            contact_name="Capt. Derek Miller (Fire Robotics)",
            contact_phone="+1 (213) 555-0192",
            human_verified_by="Command_Op_Chief_7",
            human_verified_at=hours_ago(1),
            field_status_notes="Authorized by incident commander. Robot en route with escort.",
        ),

        # Allocation 2: Spot Robot deployed to Alaska/Gujarat EQ — Reached
        ResourceAllocation(
            disaster_id=gujarat_eq.id,
            resource_id=spot_robot.id,
            quantity=1,
            allocation_reason="Post-earthquake structural collapse inspection: Spot quadruped sniffer inspecting collapsed masonry",
            status=AllocationStatus.REACHED,
            distance_km=8.2,
            eta_minutes=0,
            route_name="State Highway SH-41 / Bhuj Bypass",
            contact_name="Dr. Elena Rostova (Robotics Specialist)",
            contact_phone="+1 (415) 555-0188",
            human_verified_by="Field_Safety_Supervisor",
            human_verified_at=hours_ago(2),
            field_status_notes="Unit reached incident site; 3D LiDAR SLAM mapping active inside unstable rubble.",
        ),

        # Allocation 3: Skydio X10 Drone to Florida Cyclone — Issue Reported
        ResourceAllocation(
            disaster_id=fl_hurricane.id,
            resource_id=drone_robot.id,
            quantity=2,
            allocation_reason="Aerial thermal mapping for storm surge stranded survivors along Tampa shoreline",
            status=AllocationStatus.ISSUE_REPORTED,
            distance_km=22.4,
            eta_minutes=35,
            route_name="I-275 North / Howard Frankland Bridge",
            contact_name="Chief Pilot Chloe Bennett",
            contact_phone="+1 (305) 555-0177",
            human_verified_by="Air_Operations_Lead",
            human_verified_at=hours_ago(1),
            issue_description="Tropical storm crosswinds exceeding 65 knots. Drone flight temporarily grounded under safety protocol until wind shears subside.",
            field_status_notes="Ground telemetry active. Waiting for wind window < 45 knots to resume thermal sweeps.",
        ),

        # Allocation 4: Mumbai Flooding Rescue Boat — Reached
        ResourceAllocation(
            disaster_id=mumbai_flood.id,
            resource_id=ndrf_boat.id,
            quantity=2,
            allocation_reason="Mithi river overflow waterlogging rescue operations in Kurla-BKC corridor",
            status=AllocationStatus.REACHED,
            distance_km=6.5,
            eta_minutes=0,
            route_name="LBS Marg / BKC Connector",
            contact_name="Sub-Inspector Rajesh Patil",
            contact_phone="+91 98201-11223",
            human_verified_by="HQ_Duty_Officer",
            human_verified_at=hours_ago(2),
            field_status_notes="Boats deployed in waterlogged residential sectors; 45 citizens ferried to higher ground.",
        ),

        # Allocation 5: FDNY Ambulance — Pending Approval
        ResourceAllocation(
            disaster_id=cal_fire.id,
            resource_id=fdny_amb.id,
            quantity=1,
            allocation_reason="Reinforcement Mobile ICU requested for firefighter smoke inhalation triage",
            status=AllocationStatus.PENDING_APPROVAL,
            distance_km=18.5,
            eta_minutes=25,
            route_name="I-405 South Freeway",
            contact_name="Paramedic Sarah Jenkins",
            contact_phone="+1 (212) 555-0112",
            field_status_notes="Awaiting human dispatcher sign-off before wheels roll.",
        ),
    ]

    for alloc in sample_allocations:
        db.add(alloc)

    # Mark corresponding resources as busy
    thermite_robot.status = ResourceStatus.BUSY
    spot_robot.status = ResourceStatus.BUSY
    drone_robot.status = ResourceStatus.BUSY
    ndrf_boat.status = ResourceStatus.BUSY

    db.flush()
    logger.info(f"  ✅ {len(sample_allocations)} resource allocations seeded with human verification telemetry")


def seed_sample_simulation(db) -> None:
    simulations = [
        SimulationRun(
            scenario_name="Los Angeles Canyon Wildfire — High Wind Flareup (+40 km/h)",
            rainfall_change=0.0,
            wind_speed_change=40.0,
            population_change=25000,
            result_summary='{"fire_spread_speed_kmh": 14, "robotics_needed": {"thermite_rs3": 2, "drones": 6}, "evacuation_zones": ["Zone A", "Zone B"]}',
            predicted_severity=SeverityLevel.CRITICAL,
        ),
        SimulationRun(
            scenario_name="Tampa Bay Hurricane Milton — 12ft Storm Surge",
            rainfall_change=120.0,
            wind_speed_change=45.0,
            population_change=50000,
            result_summary='{"surge_height_m": 3.6, "no_boat_mandate": true, "evacuation_wings_needed": 4, "shelter_capacity_pct": 92}',
            predicted_severity=SeverityLevel.CRITICAL,
        ),
        SimulationRun(
            scenario_name="Mumbai Flood — High Rainfall Surge (+100mm)",
            rainfall_change=100.0,
            wind_speed_change=0.0,
            population_change=50000,
            result_summary='{"predicted_area_km2": 45, "additional_evacuations": 120000, "resources_needed": {"boats": 15, "rescue_teams": 8}}',
            predicted_severity=SeverityLevel.CRITICAL,
        ),
    ]
    for sim in simulations:
        db.add(sim)
    logger.info(f"  ✅ {len(simulations)} simulation runs inserted")


def seed_api_sync_log(db) -> None:
    logs = [
        ApiSyncLog(source_name="NOAA NWS API", sync_status=SyncStatus.SUCCESS, records_fetched=18, started_at=hours_ago(1), completed_at=hours_ago(1) + timedelta(seconds=3)),
        ApiSyncLog(source_name="USGS Earthquake API", sync_status=SyncStatus.SUCCESS, records_fetched=8, started_at=hours_ago(1), completed_at=hours_ago(1) + timedelta(seconds=2)),
        ApiSyncLog(source_name="GDACS", sync_status=SyncStatus.SUCCESS, records_fetched=14, started_at=hours_ago(2), completed_at=hours_ago(2) + timedelta(seconds=4)),
        ApiSyncLog(source_name="Open-Meteo", sync_status=SyncStatus.SUCCESS, records_fetched=20, started_at=hours_ago(1), completed_at=hours_ago(1) + timedelta(seconds=3)),
    ]
    for log in logs:
        db.add(log)
    logger.info(f"  ✅ {len(logs)} API sync logs inserted")


# ===========================================================================
# MAIN SEED FUNCTION
# ===========================================================================

def seed_all(reset: bool = False) -> None:
    logger.info("=" * 60)
    logger.info("🌱 ADCC Database Seeding (USA & India Multi-Regional)")
    logger.info("=" * 60)

    if reset:
        logger.warning("⚠️  Reset mode: dropping and recreating all tables...")
        from database.postgres import drop_tables
        drop_tables()
        create_tables()
        logger.info("  ✅ All tables dropped and freshly recreated")
    else:
        create_tables()

    db = SessionLocal()
    try:

        existing = db.query(Disaster).count()
        if existing > 0 and not reset:
            logger.warning(f"⚠️  Database already has {existing} disasters. Use reset=True to re-seed.")
            return

        disasters = seed_disasters(db)
        resources = seed_resources(db)
        seed_hospitals(db)
        seed_shelters(db)
        seed_alerts(db)
        seed_data_sources(db)
        seed_sample_allocations(db, disasters, resources)
        seed_sample_simulation(db)
        seed_api_sync_log(db)

        db.commit()
        logger.info("=" * 60)
        logger.info("✅ Database seeding completed successfully!")
        logger.info(f"   Disasters:       {len(DISASTERS)} (USA & India)")
        logger.info(f"   Resources:       {len(RESOURCES)} (Includes USA Robots, Ambulances, Evacuation Teams)")
        logger.info(f"   Hospitals:       {len(HOSPITALS)}")
        logger.info(f"   Shelters:        {len(SHELTERS)}")
        logger.info(f"   Alerts:          {len(ALERTS)}")
        logger.info("=" * 60)

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    seed_all(reset=reset_flag)
