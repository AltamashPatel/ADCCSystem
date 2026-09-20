"""
ADCC — FastAPI Application
===========================
Main FastAPI application for the Autonomous Disaster Command Center backend.

Endpoints:
    GET  /health                → Database & system health check
    GET  /api/disasters         → List all disasters (with filters)
    POST /api/disasters         → Create new disaster
    GET  /api/resources         → List all resources (with filters)
    POST /api/resources         → Create new resource
    GET  /api/hospitals         → List all hospitals
    GET  /api/shelters          → List all shelters
    GET  /api/alerts            → List all alerts (with severity filter)
    POST /api/alerts            → Create new alert
    GET  /api/datasources       → List all external API data sources
    GET  /api/sync-logs         → API sync history
    GET  /api/verification-logs → Verification records per disaster
    GET  /api/allocations       → Resource allocation records
    POST /api/allocations       → Create new resource allocation
    GET  /api/simulations       → Simulation run records
    POST /api/simulations       → Create new simulation run

CORS:
    Allows requests from React frontend (localhost:5173 — Vite dev server)

Future Integration:
    - LangGraph agents call POST endpoints to log their decisions
    - verification_agent.py → POST /api/verification-logs
    - allocation_agent.py   → POST /api/allocations
    - simulation_engine.py  → POST /api/simulations
    - gdacs_tool.py         → POST /api/disasters (from external feed)
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.models import (
    Alert,
    AllocationStatus,
    ApiSyncLog,
    DataSource,
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
from database.postgres import get_db, test_connection

# ===========================================================================
# APP INITIALIZATION
# ===========================================================================

app = FastAPI(
    title="ADCC — Autonomous Disaster Command Center API",
    description=(
        "Backend API for the ADCC system. Manages disaster events, resources, "
        "hospitals, shelters, alerts, and AI agent decision logs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow React frontend (Vite dev server on :5173 and :3000)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================================================
# STARTUP EVENT
# ===========================================================================

@app.on_event("startup")
async def startup_event():
    """Test DB connection on app startup, ensure tables exist, and seed database if empty."""
    logger.info("🚀 ADCC API starting up...")
    
    # Check connection
    db_connected = test_connection()
    if db_connected:
        logger.info("✅ Database connection successful")
    else:
        logger.warning("⚠️ Main database connection failed. Falling back to SQLite.")

    # Create tables and auto-seed if needed
    try:
        from database.postgres import create_tables
        from database.seed_data import seed_all
        
        # Ensure tables exist
        create_tables()
        
        # Run seed_all (checks internally if data already exists, safe to call)
        seed_all(reset=False)
        logger.info("✅ Database tables verified and auto-seeding completed.")
    except Exception as e:
        logger.error(f"❌ Error during startup database initialization: {e}")


# ===========================================================================
# PYDANTIC SCHEMAS
# ===========================================================================

# ── Disaster ────────────────────────────────────────────────────────────────

class DisasterCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    disaster_type: DisasterType
    severity: SeverityLevel
    status: DisasterStatus = DisasterStatus.ACTIVE
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    country: Optional[str] = "India"
    affected_population: Optional[int] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    source: Optional[str] = None
    source_type: Optional[SourceType] = None
    source_url: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED


class DisasterResponse(BaseModel):
    id: uuid.UUID
    title: str
    disaster_type: DisasterType
    severity: SeverityLevel
    status: DisasterStatus
    latitude: float
    longitude: float
    country: str = "India"
    affected_population: Optional[int]
    confidence_score: Optional[float]
    source: Optional[str]
    source_type: Optional[SourceType]
    source_url: Optional[str]
    verification_status: VerificationStatus
    last_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Resource ────────────────────────────────────────────────────────────────

class ResourceCreate(BaseModel):
    resource_name: str = Field(..., min_length=2, max_length=255)
    resource_type: ResourceType
    status: ResourceStatus = ResourceStatus.AVAILABLE
    quantity: int = Field(1, ge=1)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = "India"
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    model_spec: Optional[str] = None
    capabilities: Optional[str] = None


class ResourceResponse(BaseModel):
    id: uuid.UUID
    resource_name: str
    resource_type: ResourceType
    status: ResourceStatus
    quantity: int
    latitude: Optional[float]
    longitude: Optional[float]
    country: str = "India"
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    model_spec: Optional[str] = None
    capabilities: Optional[str] = None
    last_updated: datetime

    class Config:
        from_attributes = True


# ── Hospital ────────────────────────────────────────────────────────────────

class HospitalResponse(BaseModel):
    id: uuid.UUID
    name: str
    city: str
    total_beds: int
    available_beds: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True


# ── Shelter ─────────────────────────────────────────────────────────────────

class ShelterResponse(BaseModel):
    id: uuid.UUID
    name: str
    city: str
    capacity: int
    occupied: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True


# ── Alert ────────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    severity: SeverityLevel
    message: str
    source: Optional[str] = None
    source_type: Optional[SourceType] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class AlertResponse(BaseModel):
    id: uuid.UUID
    title: str
    severity: SeverityLevel
    message: str
    source: Optional[str]
    source_type: Optional[SourceType]
    source_url: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ── DataSource ───────────────────────────────────────────────────────────────

class DataSourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    source_type: SourceType
    base_url: str
    status: str
    last_sync: Optional[datetime]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── ApiSyncLog ───────────────────────────────────────────────────────────────

class ApiSyncLogResponse(BaseModel):
    id: uuid.UUID
    source_name: str
    sync_status: SyncStatus
    records_fetched: Optional[int]
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── VerificationLog ──────────────────────────────────────────────────────────

class VerificationLogCreate(BaseModel):
    disaster_id: uuid.UUID
    source_checked: str
    result: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    notes: Optional[str] = None


class VerificationLogResponse(BaseModel):
    id: uuid.UUID
    disaster_id: uuid.UUID
    source_checked: str
    result: str
    confidence: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── ResourceAllocation ───────────────────────────────────────────────────────

class AllocationCreate(BaseModel):
    disaster_id: uuid.UUID
    resource_id: uuid.UUID
    quantity: int = Field(1, ge=1)
    allocation_reason: Optional[str] = None
    status: AllocationStatus = AllocationStatus.PENDING_APPROVAL
    distance_km: Optional[float] = None
    eta_minutes: Optional[int] = None
    route_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    human_verified_by: Optional[str] = None
    field_status_notes: Optional[str] = None
    issue_description: Optional[str] = None


class AllocationVerifyRequest(BaseModel):
    status: AllocationStatus
    human_verified_by: Optional[str] = "Command_Duty_Officer"
    field_status_notes: Optional[str] = None
    issue_description: Optional[str] = None


class AllocationResponse(BaseModel):
    id: uuid.UUID
    disaster_id: uuid.UUID
    resource_id: uuid.UUID
    quantity: int
    allocation_reason: Optional[str]
    status: AllocationStatus
    distance_km: Optional[float] = None
    eta_minutes: Optional[int] = None
    route_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    human_verified_by: Optional[str] = None
    human_verified_at: Optional[datetime] = None
    field_status_notes: Optional[str] = None
    issue_description: Optional[str] = None

    # Joined helper fields for dashboard tables
    disaster_title: Optional[str] = None
    disaster_type: Optional[str] = None
    disaster_severity: Optional[str] = None
    disaster_country: Optional[str] = None
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_model: Optional[str] = None

    allocated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── SimulationRun ────────────────────────────────────────────────────────────

class SimulationCreate(BaseModel):
    scenario_name: str = Field(..., min_length=3, max_length=255)
    rainfall_change: Optional[float] = None
    wind_speed_change: Optional[float] = None
    population_change: Optional[int] = None
    result_summary: Optional[str] = None
    predicted_severity: Optional[SeverityLevel] = None


class SimulationResponse(BaseModel):
    id: uuid.UUID
    scenario_name: str
    rainfall_change: Optional[float]
    wind_speed_change: Optional[float]
    population_change: Optional[int]
    result_summary: Optional[str]
    predicted_severity: Optional[SeverityLevel]
    created_at: datetime

    class Config:
        from_attributes = True


# ===========================================================================
# HEALTH CHECK
# ===========================================================================

@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.
    Verifies database connectivity and returns system status.
    """
    try:
        disaster_count = db.query(Disaster).count()
        resource_count = db.query(Resource).count()
        return {
            "status": "healthy",
            "database": "connected",
            "stats": {
                "disasters": disaster_count,
                "resources": resource_count,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")


# ===========================================================================
# DISASTER ENDPOINTS
# ===========================================================================

@app.get("/api/disasters", response_model=list[DisasterResponse], tags=["Disasters"])
def get_disasters(
    disaster_type: Optional[DisasterType] = Query(None),
    severity: Optional[SeverityLevel] = Query(None),
    status: Optional[DisasterStatus] = Query(None),
    verification_status: Optional[VerificationStatus] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Get all disasters with optional filters.

    Query params:
        disaster_type: Filter by type (Flood, Cyclone, Earthquake, etc.)
        severity:      Filter by severity (Low, Medium, High, Critical)
        status:        Filter by status (Active, Monitoring, Resolved, Archived)
        verification_status: Filter by verification state
        limit:         Max records to return (default 50)
        offset:        Pagination offset
    """
    query = db.query(Disaster)
    if disaster_type:
        query = query.filter(Disaster.disaster_type == disaster_type)
    if severity:
        query = query.filter(Disaster.severity == severity)
    if status:
        query = query.filter(Disaster.status == status)
    if verification_status:
        query = query.filter(Disaster.verification_status == verification_status)

    return query.order_by(Disaster.created_at.desc()).offset(offset).limit(limit).all()


@app.post("/api/disasters", response_model=DisasterResponse, status_code=201, tags=["Disasters"])
def create_disaster(payload: DisasterCreate, db: Session = Depends(get_db)):
    """
    Create a new disaster record.
    Called by: data_collection_agent.py, gdacs_tool.py, Manual entry.
    """
    disaster = Disaster(**payload.model_dump())
    db.add(disaster)
    db.commit()
    db.refresh(disaster)
    logger.info(f"✅ New disaster created: {disaster.title} [{disaster.id}]")
    return disaster


@app.get("/api/disasters/{disaster_id}", response_model=DisasterResponse, tags=["Disasters"])
def get_disaster(disaster_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific disaster by ID."""
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    return disaster


@app.post("/api/disasters/sync", tags=["Disasters"])
def sync_disasters_endpoint(db: Session = Depends(get_db)):
    """
    Fetch active disasters from NOAA NWS (USA), GDACS (Global/India), and USGS (Earthquakes),
    insert new ones, and update existing ones.
    """
    try:
        from tools.gdacs_tool import get_active_disasters
        from tools.disaster_tool import get_recent_earthquakes
        from tools.nws_tool import get_active_usa_disasters
        
        synced_count = 0

        # 1. Fetch live USA alerts from NOAA NWS
        try:
            nws_events = get_active_usa_disasters(limit=30)
            for ne in nws_events:
                existing = db.query(Disaster).filter(
                    (Disaster.title == ne.title) | 
                    ((Disaster.source_url == ne.source_url) & (ne.source_url is not None))
                ).first()

                if not existing:
                    d_type = DisasterType.FLOOD
                    if ne.event_type == "Cyclone": d_type = DisasterType.CYCLONE
                    elif ne.event_type == "Wildfire": d_type = DisasterType.WILDFIRE
                    elif ne.event_type == "Earthquake": d_type = DisasterType.EARTHQUAKE

                    new_disaster = Disaster(
                        title=ne.title,
                        disaster_type=d_type,
                        severity=SeverityLevel(ne.severity_mapped),
                        status=DisasterStatus.ACTIVE,
                        latitude=ne.latitude,
                        longitude=ne.longitude,
                        country="USA",
                        affected_population=ne.affected_population or 25000,
                        confidence_score=0.95,
                        source=ne.source,
                        source_type=SourceType.NWS,
                        source_url=ne.source_url,
                        verification_status=VerificationStatus.VERIFIED
                    )
                    db.add(new_disaster)
                    synced_count += 1
        except Exception as nws_err:
            logger.warning(f"NWS sync error: {nws_err}")

        # 2. Fetch from GDACS
        gdacs_res = get_active_disasters(limit=50)
        gdacs_events = gdacs_res.events
        
        # 3. Fetch from USGS
        usgs_res = get_recent_earthquakes(limit=50)
        usgs_events = usgs_res.events
        
        # Helper to map GDACS event type to DB DisasterType
        def map_gdacs_type(code: str) -> DisasterType:
            code_upper = code.upper()
            if code_upper == "FL":
                return DisasterType.FLOOD
            elif code_upper == "TC":
                return DisasterType.CYCLONE
            elif code_upper == "EQ":
                return DisasterType.EARTHQUAKE
            elif code_upper == "WF":
                return DisasterType.WILDFIRE
            return DisasterType.FLOOD

        # Process GDACS
        for e in gdacs_events:
            existing = db.query(Disaster).filter(
                (Disaster.title == e.title) | 
                ((Disaster.source_url == e.url) & (e.url is not None))
            ).first()
            
            if not existing:
                country_label = "Global"
                if "united states" in (e.country or "").lower() or (e.longitude and e.longitude < -50 and e.latitude and e.latitude > 15):
                    country_label = "USA"
                elif "india" in (e.country or "").lower() or (e.latitude and 6 <= e.latitude <= 38 and e.longitude and 68 <= e.longitude <= 98):
                    country_label = "India"
                elif e.country:
                    country_label = e.country

                new_disaster = Disaster(
                    title=e.title,
                    disaster_type=map_gdacs_type(e.event_type),
                    severity=SeverityLevel(e.severity_mapped),
                    status=DisasterStatus.ACTIVE,
                    latitude=e.latitude if e.latitude is not None else 0.0,
                    longitude=e.longitude if e.longitude is not None else 0.0,
                    country=country_label,
                    affected_population=e.affected_population or 50000,
                    confidence_score=e.alert_score / 5.0 if e.alert_score is not None else 0.5,
                    source=f"GDACS {e.event_id}",
                    source_type=SourceType.GDACS,
                    source_url=e.url,
                    verification_status=VerificationStatus.UNVERIFIED
                )
                if new_disaster.confidence_score is not None:
                    new_disaster.confidence_score = max(0.0, min(1.0, new_disaster.confidence_score))
                db.add(new_disaster)
                synced_count += 1
                
        # Process USGS
        for e in usgs_events:
            existing = db.query(Disaster).filter(
                (Disaster.title == f"Earthquake: {e.place}") |
                ((Disaster.source_url == e.usgs_url) & (e.usgs_url is not None))
            ).first()
            
            if not existing:
                place_l = (e.place or "").lower()
                c_label = "Global"
                if any(st in place_l for st in ["california", "alaska", "hawaii", "nevada", "texas", "oregon", "washington", "oklahoma", "ca", "ak", "hi", "nv"]):
                    c_label = "USA"
                elif (e.longitude and e.longitude < -50 and e.latitude and e.latitude > 15):
                    c_label = "USA"
                elif "india" in place_l or (e.latitude and 6 <= e.latitude <= 38 and e.longitude and 68 <= e.longitude <= 98):
                    c_label = "India"

                new_disaster = Disaster(
                    title=f"Earthquake: {e.place}",
                    disaster_type=DisasterType.EARTHQUAKE,
                    severity=SeverityLevel(e.severity_mapped),
                    status=DisasterStatus.ACTIVE,
                    latitude=e.latitude,
                    longitude=e.longitude,
                    country=c_label,
                    affected_population=e.felt_reports or 1000,
                    confidence_score=0.9,
                    source=f"USGS {e.usgs_id}",
                    source_type=SourceType.USGS,
                    source_url=e.usgs_url,
                    verification_status=VerificationStatus.VERIFIED
                )
                db.add(new_disaster)
                synced_count += 1
                
        db.commit()
        logger.info(f"🔄 Synced external disasters: added {synced_count} new events.")
        return {"status": "success", "synced_count": synced_count}
    except Exception as ex:
        db.rollback()
        logger.error(f"❌ Error syncing disasters: {ex}")
        raise HTTPException(status_code=500, detail=str(ex))


# ===========================================================================
# RESOURCE ENDPOINTS
# ===========================================================================

@app.get("/api/resources", response_model=list[ResourceResponse], tags=["Resources"])
def get_resources(
    resource_type: Optional[ResourceType] = Query(None),
    status: Optional[ResourceStatus] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Get all resources with optional filters.
    Used by: allocation_agent.py, resource_tool.py
    """
    query = db.query(Resource)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if status:
        query = query.filter(Resource.status == status)
    return query.offset(offset).limit(limit).all()


@app.post("/api/resources", response_model=ResourceResponse, status_code=201, tags=["Resources"])
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db)):
    """Create a new resource record."""
    resource = Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


# ===========================================================================
# HOSPITAL ENDPOINTS
# ===========================================================================

@app.get("/api/hospitals", response_model=list[HospitalResponse], tags=["Hospitals"])
def get_hospitals(
    city: Optional[str] = Query(None),
    min_available_beds: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get all hospitals.
    Used by: allocation_agent.py to find nearest hospital with available beds.
    """
    query = db.query(Hospital)
    if city:
        query = query.filter(Hospital.city.ilike(f"%{city}%"))
    if min_available_beds:
        query = query.filter(Hospital.available_beds >= min_available_beds)
    return query.limit(limit).all()


# ===========================================================================
# SHELTER ENDPOINTS
# ===========================================================================

@app.get("/api/shelters", response_model=list[ShelterResponse], tags=["Shelters"])
def get_shelters(
    city: Optional[str] = Query(None),
    min_available_capacity: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get all shelters.
    Used by: shelter_agent.py to find available shelter for evacuees.
    """
    query = db.query(Shelter)
    if city:
        query = query.filter(Shelter.city.ilike(f"%{city}%"))
    if min_available_capacity:
        query = query.filter((Shelter.capacity - Shelter.occupied) >= min_available_capacity)
    return query.limit(limit).all()


# ===========================================================================
# ALERT ENDPOINTS
# ===========================================================================

@app.get("/api/alerts", response_model=list[AlertResponse], tags=["Alerts"])
def get_alerts(
    severity: Optional[SeverityLevel] = Query(None),
    source_type: Optional[SourceType] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Get all alerts.
    Used by: notification_tool.py, command_center dashboard.
    """
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity)
    if source_type:
        query = query.filter(Alert.source_type == source_type)
    return query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()


@app.post("/api/alerts", response_model=AlertResponse, status_code=201, tags=["Alerts"])
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    """
    Create a new alert.
    Called by: severity_agent.py (on severity escalation), data_collection_agent.py
    """
    alert = Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    logger.info(f"🔔 New alert: {alert.title} [{alert.severity.value}]")
    return alert


# ===========================================================================
# DATA SOURCE ENDPOINTS
# ===========================================================================

@app.get("/api/datasources", response_model=list[DataSourceResponse], tags=["Data Sources"])
def get_data_sources(db: Session = Depends(get_db)):
    """Get all registered external API data sources."""
    return db.query(DataSource).all()


# ===========================================================================
# API SYNC LOG ENDPOINTS
# ===========================================================================

@app.get("/api/sync-logs", response_model=list[ApiSyncLogResponse], tags=["API Sync"])
def get_sync_logs(
    source_name: Optional[str] = Query(None),
    sync_status: Optional[SyncStatus] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get API sync history.
    Used by: command_center.py dashboard to show API health.
    """
    query = db.query(ApiSyncLog)
    if source_name:
        query = query.filter(ApiSyncLog.source_name.ilike(f"%{source_name}%"))
    if sync_status:
        query = query.filter(ApiSyncLog.sync_status == sync_status)
    return query.order_by(ApiSyncLog.started_at.desc()).limit(limit).all()


# ===========================================================================
# VERIFICATION LOG ENDPOINTS
# ===========================================================================

@app.get("/api/verification-logs", response_model=list[VerificationLogResponse], tags=["Verification"])
def get_verification_logs(
    disaster_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get verification log records.
    Used by: verification_agent.py, command_center dashboard.
    """
    query = db.query(VerificationLog)
    if disaster_id:
        query = query.filter(VerificationLog.disaster_id == disaster_id)
    return query.order_by(VerificationLog.created_at.desc()).limit(limit).all()


@app.post("/api/verification-logs", response_model=VerificationLogResponse, status_code=201, tags=["Verification"])
def create_verification_log(payload: VerificationLogCreate, db: Session = Depends(get_db)):
    """
    Log a verification check result.
    Called by: verification_agent.py after each source check.
    """
    # Validate disaster exists
    disaster = db.query(Disaster).filter(Disaster.id == payload.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")

    log = VerificationLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ===========================================================================
# RESOURCE ALLOCATION ENDPOINTS
# ===========================================================================

@app.get("/api/allocations", response_model=list[AllocationResponse], tags=["Allocations"])
def get_allocations(
    disaster_id: Optional[uuid.UUID] = Query(None),
    status: Optional[AllocationStatus] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Get resource allocation records enriched with incident, contact, and verification telemetry.
    """
    query = db.query(ResourceAllocation)
    if disaster_id:
        query = query.filter(ResourceAllocation.disaster_id == disaster_id)
    if status:
        query = query.filter(ResourceAllocation.status == status)
    
    allocations = query.order_by(ResourceAllocation.allocated_at.desc()).limit(limit).all()
    results = []

    for a in allocations:
        resp = AllocationResponse.model_validate(a)
        if a.disaster:
            resp.disaster_title = a.disaster.title
            resp.disaster_type = a.disaster.disaster_type.value
            resp.disaster_severity = a.disaster.severity.value
            resp.disaster_country = getattr(a.disaster, "country", "India")
        if a.resource:
            resp.resource_name = a.resource.resource_name
            resp.resource_type = a.resource.resource_type.value
            resp.resource_model = getattr(a.resource, "model_spec", None) or a.resource.resource_name
            if not resp.contact_name:
                resp.contact_name = getattr(a.resource, "contact_name", None)
            if not resp.contact_phone:
                resp.contact_phone = getattr(a.resource, "contact_phone", None)
        results.append(resp)

    return results


@app.post("/api/allocations", response_model=AllocationResponse, status_code=201, tags=["Allocations"])
def create_allocation(payload: AllocationCreate, db: Session = Depends(get_db)):
    """
    Create a resource allocation record.
    Initial status is PENDING_APPROVAL unless explicitly specified.
    """
    # Validate disaster and resource exist
    disaster = db.query(Disaster).filter(Disaster.id == payload.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")

    resource = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    alloc_data = payload.model_dump()
    if not alloc_data.get("contact_name"):
        alloc_data["contact_name"] = resource.contact_name
    if not alloc_data.get("contact_phone"):
        alloc_data["contact_phone"] = resource.contact_phone

    allocation = ResourceAllocation(**alloc_data)
    db.add(allocation)

    # If dispatched or reached immediately, update resource status
    if allocation.status in [AllocationStatus.DISPATCHED, AllocationStatus.ACTIVE, AllocationStatus.REACHED]:
        resource.status = ResourceStatus.BUSY

    db.commit()
    db.refresh(allocation)
    logger.info(f"🚁 Resource allocated: {resource.resource_name} → Disaster {disaster.title} [Status: {allocation.status.value}]")

    resp = AllocationResponse.model_validate(allocation)
    resp.disaster_title = disaster.title
    resp.disaster_type = disaster.disaster_type.value
    resp.disaster_severity = disaster.severity.value
    resp.disaster_country = getattr(disaster, "country", "India")
    resp.resource_name = resource.resource_name
    resp.resource_type = resource.resource_type.value
    resp.resource_model = getattr(resource, "model_spec", None)
    return resp


@app.patch("/api/allocations/{allocation_id}/verify", response_model=AllocationResponse, tags=["Allocations"])
def verify_allocation_endpoint(
    allocation_id: uuid.UUID,
    payload: AllocationVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Human verification endpoint:
    - Approve & Dispatch (PENDING_APPROVAL -> DISPATCHED)
    - Confirm Reached (REACHED)
    - Report Field Issue (ISSUE_REPORTED with issue_description & notes)
    - Complete Mission (COMPLETED -> frees resource back to AVAILABLE)
    """
    from datetime import timezone
    allocation = db.query(ResourceAllocation).filter(ResourceAllocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Resource allocation not found")

    allocation.status = payload.status
    allocation.human_verified_by = payload.human_verified_by or "Command_Duty_Officer"
    allocation.human_verified_at = datetime.now(timezone.utc)

    if payload.field_status_notes:
        allocation.field_status_notes = payload.field_status_notes
    if payload.issue_description:
        allocation.issue_description = payload.issue_description

    resource = db.query(Resource).filter(Resource.id == allocation.resource_id).first()
    if resource:
        if payload.status in [AllocationStatus.DISPATCHED, AllocationStatus.EN_ROUTE, AllocationStatus.REACHED]:
            resource.status = ResourceStatus.BUSY
        elif payload.status in [AllocationStatus.COMPLETED, AllocationStatus.CANCELLED]:
            resource.status = ResourceStatus.AVAILABLE
            allocation.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(allocation)
    logger.info(f"✅ Human verification recorded for Allocation [{allocation.id}]: Status={allocation.status.value}")

    disaster = db.query(Disaster).filter(Disaster.id == allocation.disaster_id).first()
    resp = AllocationResponse.model_validate(allocation)
    if disaster:
        resp.disaster_title = disaster.title
        resp.disaster_type = disaster.disaster_type.value
        resp.disaster_severity = disaster.severity.value
        resp.disaster_country = getattr(disaster, "country", "India")
    if resource:
        resp.resource_name = resource.resource_name
        resp.resource_type = resource.resource_type.value
        resp.resource_model = getattr(resource, "model_spec", None)
    return resp


@app.get("/api/allocations/recommend", tags=["Allocations"])
def recommend_allocation(disaster_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Computes an AI-driven allocation recommendation for a selected disaster.
    Enforces domain rules:
      - Cyclone/Hurricane: strictly NO boats/lifeboats! (Allocates Evacuation Teams, Robots, Ambulances)
      - Proximity: matches regional reserves (USA vs India) and computes closest Haversine distance,
        transit ETA, designated highway corridor, and assigned personnel contact.
    """
    disaster = db.query(Disaster).filter(Disaster.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    dis_type = disaster.disaster_type.value
    severity = disaster.severity.value
    
    from agents.allocation_agent import ALLOCATION_RULES
    needs = dict(ALLOCATION_RULES.get(dis_type, {}).get(severity, {}))
    
    # Strict rule requested by user: In Cyclone, NEVER allocate lifeboat/boat!
    if dis_type == "Cyclone":
        needs.pop("Boat", None)
        if not needs:
            needs = {"Evacuation Team": 1, "Robot": 1, "Ambulance": 1}

    if not needs:
        if dis_type == "Earthquake": needs = {"Robot": 1, "Ambulance": 1}
        elif dis_type == "Wildfire": needs = {"Robot": 1, "Evacuation Team": 1}
        elif dis_type == "Flood": needs = {"Boat": 1, "Ambulance": 1}
        else: needs = {"Ambulance": 1}

    req_res_name = list(needs.keys())[0]
    req_qty = needs[req_res_name]
    
    from database.models import ResourceType, ResourceStatus
    type_map = {
        "Boat": ResourceType.BOAT,
        "Ambulance": ResourceType.AMBULANCE,
        "Medical Team": ResourceType.MEDICAL_TEAM,
        "Rescue Team": ResourceType.RESCUE_TEAM,
        "NDRF Unit": ResourceType.NDRF_UNIT,
        "Helicopter": ResourceType.HELICOPTER,
        "Food Truck": ResourceType.FOOD_TRUCK,
        "Robot": ResourceType.ROBOT,
        "Evacuation Team": ResourceType.EVACUATION_TEAM,
    }
    r_type_val = type_map.get(req_res_name, ResourceType.AMBULANCE)

    # Determine region of the disaster
    disaster_country = getattr(disaster, "country", "India")
    is_usa = (disaster_country == "USA") or (disaster.longitude is not None and disaster.longitude < -50)

    # Filter resources by type and regional proximity
    query = db.query(Resource).filter(
        Resource.resource_type == r_type_val,
        Resource.status == ResourceStatus.AVAILABLE,
        Resource.quantity > 0
    )

    if is_usa:
        regional_pool = query.filter(Resource.country == "USA").all()
        available_resources = regional_pool if regional_pool else query.all()
    else:
        regional_pool = query.filter(Resource.country == "India").all()
        available_resources = regional_pool if regional_pool else query.all()
    
    if not available_resources:
        # Fallback to any available resource in stock
        available_resources = db.query(Resource).filter(
            Resource.status == ResourceStatus.AVAILABLE,
            Resource.quantity > 0
        ).all()
        if not available_resources:
            raise HTTPException(status_code=404, detail=f"No available {req_res_name} resources in stock.")

    from services.simulation_engine import _haversine_km
    closest_res = None
    min_dist = float('inf')
    
    for r in available_resources:
        if r.latitude is not None and r.longitude is not None:
            dist = _haversine_km(disaster.latitude, disaster.longitude, r.latitude, r.longitude)
            if dist < min_dist:
                min_dist = dist
                closest_res = r
                
    if not closest_res:
        closest_res = available_resources[0]
        min_dist = 45.0

    # Route Name assignment based on location
    dis_title_l = disaster.title.lower()
    if is_usa:
        if "california" in dis_title_l or "los angeles" in dis_title_l or "canyon" in dis_title_l:
            route_name = "US-101 North / Topanga Canyon Corridor"
        elif "florida" in dis_title_l or "tampa" in dis_title_l or "milton" in dis_title_l:
            route_name = "I-275 North / Howard Frankland Bridge Corridor"
        elif "texas" in dis_title_l or "houston" in dis_title_l:
            route_name = "I-10 / I-45 Houston Gulf Corridor"
        elif "alaska" in dis_title_l or "anchorage" in dis_title_l:
            route_name = "AK-1 / Seward Highway Corridor"
        else:
            route_name = "Interstate Highway Corridor (US DOT)"
    else:
        if "mumbai" in dis_title_l or "pune" in dis_title_l:
            route_name = "Mumbai-Pune Expressway / NH-48"
        elif "delhi" in dis_title_l or "rishikesh" in dis_title_l:
            route_name = "NH-334 / Haridwar-Rishikesh Highway"
        elif "assam" in dis_title_l or "kolkata" in dis_title_l:
            route_name = "NH-27 (East-West Corridor)"
        else:
            route_name = "National Highway Corridor NH-48"

    # ETA Calculation
    transit_speed = 70.0 if closest_res.resource_type == ResourceType.ROBOT else 60.0
    eta_mins = max(5, int((min_dist / transit_speed) * 60))

    ai_reason = (
        f"AI Allocation Recommendation: Selected '{closest_res.resource_name}' "
        f"({closest_res.model_spec or closest_res.resource_type.value}) stationed {min_dist:.1f} km away. "
        f"{'Strict domain safety protocol: boats prohibited during cyclone winds; heavy tactical units dispatched instead. ' if dis_type == 'Cyclone' else ''}"
        f"Route: {route_name} (ETA ~{eta_mins} mins). Responder In-Charge: {closest_res.contact_name or 'Command Ops'} "
        f"(Phone: {closest_res.contact_phone or 'Direct Radio Link'})."
    )
    
    return {
        "resource_id": str(closest_res.id),
        "resource_name": closest_res.resource_name,
        "resource_type": closest_res.resource_type.value,
        "model_spec": closest_res.model_spec or closest_res.resource_name,
        "contact_name": closest_res.contact_name or "Command Duty Officer",
        "contact_phone": closest_res.contact_phone or "N/A",
        "capabilities": closest_res.capabilities or "Standard Deployment",
        "quantity": min(req_qty, closest_res.quantity),
        "distance_km": round(min_dist, 1),
        "distance_miles": round(min_dist * 0.621371, 1),
        "eta_minutes": eta_mins,
        "route_name": route_name,
        "recommendation_reason": ai_reason
    }


# ===========================================================================
# SIMULATION ENDPOINTS
# ===========================================================================

@app.get("/api/simulations", response_model=list[SimulationResponse], tags=["Simulations"])
def get_simulations(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Get simulation run records.
    Used by: simulation_engine.py, Digital Twin dashboard.
    """
    return db.query(SimulationRun).order_by(SimulationRun.created_at.desc()).limit(limit).all()


@app.post("/api/simulations", response_model=SimulationResponse, status_code=201, tags=["Simulations"])
def create_simulation(payload: SimulationCreate, db: Session = Depends(get_db)):
    """
    Log a new simulation run.
    Called by: services/simulation_engine.py after completing a scenario.
    """
    simulation = SimulationRun(**payload.model_dump())
    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    logger.info(f"🔬 Simulation created: {simulation.scenario_name}")
    return simulation


class SimulationRunRequest(BaseModel):
    simulation_type: str = Field(..., description="Flood, Cyclone, or Earthquake")
    rainfall_change_pct: float = Field(0.0)
    wind_speed_change_pct: float = Field(0.0)
    population_change_pct: float = Field(0.0)
    shelter_capacity_change_pct: float = Field(0.0)
    resource_availability_change_pct: float = Field(0.0)
    disaster_id: Optional[str] = None


@app.post("/api/simulations/run", tags=["Simulations"])
def run_simulation_scenario(payload: SimulationRunRequest, db: Session = Depends(get_db)):
    """
    Runs a digital twin simulation with specified parameters,
    persists it into the DB, and returns comparison outcomes.
    """
    try:
        from services.simulation_engine import run_simulation
        result = run_simulation(
            db=db,
            simulation_type=payload.simulation_type,
            rainfall_change_pct=payload.rainfall_change_pct,
            wind_speed_change_pct=payload.wind_speed_change_pct,
            population_change_pct=payload.population_change_pct,
            shelter_capacity_change_pct=payload.shelter_capacity_change_pct,
            resource_availability_change_pct=payload.resource_availability_change_pct,
            disaster_id=payload.disaster_id
        )
        return result
    except Exception as e:
        logger.error(f"Error running simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# ROOT
# ===========================================================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[ChatMessage]] = None


@app.post("/api/command-center/chat", tags=["Command Center AI"])
def command_center_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Cognitive Chatbot endpoint. Ask natural language questions about active disasters,
    allocations, shelter occupancy, and what-if simulation results.
    """
    try:
        from agents.command_center import analyze_disaster
        # Convert Pydantic objects to simple dicts for conversation history
        history = []
        if payload.conversation_history:
            history = [{"role": msg.role, "content": msg.content} for msg in payload.conversation_history]
            
        answer = analyze_disaster(db, payload.message, conversation_history=history)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in command center chatbot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/command-center/summary", tags=["Command Center AI"])
def get_cognitive_summary(db: Session = Depends(get_db)):
    """Generates an AI-authored comprehensive situation report of active hazard zones."""
    try:
        from agents.command_center import summarize_current_situation
        summary = summarize_current_situation(db)
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error generating situation report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/command-center/explain-severity", tags=["Command Center AI"])
def get_severity_explanation(db: Session = Depends(get_db)):
    """Generates an AI explanation of active severity stress factors."""
    try:
        from agents.command_center import explain_severity
        explanation = explain_severity(db)
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"Error generating severity explanation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/command-center/explain-allocation", tags=["Command Center AI"])
def get_allocation_explanation(db: Session = Depends(get_db)):
    """Generates an AI explanation of resource allocations and depot strain."""
    try:
        from agents.command_center import explain_resource_allocation
        explanation = explain_resource_allocation(db)
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"Error generating allocation explanation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/command-center/explain-shelters", tags=["Command Center AI"])
def get_shelter_explanation(db: Session = Depends(get_db)):
    """Generates an AI explanation of evacuation routing and shelter utilization."""
    try:
        from agents.command_center import explain_shelter_plan
        explanation = explain_shelter_plan(db)
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"Error generating shelter explanation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/command-center/recommendations", tags=["Command Center AI"])
def get_action_recommendations(db: Session = Depends(get_db)):
    """Generates AI tactical action recommendations for command center operators."""
    try:
        from agents.command_center import generate_action_recommendations
        recommendations = generate_action_recommendations(db)
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class WorkflowRunPayload(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_label: Optional[str] = "Disaster Zone"
    country: Optional[str] = "India"
    disaster_title: Optional[str] = None
    disaster_type: Optional[str] = None


@app.post("/api/orchestration/run", tags=["Orchestration"])
def run_orchestration_workflow(payload: WorkflowRunPayload, db: Session = Depends(get_db)):
    """
    Triggers the complete LangGraph ADCC orchestration pipeline:
    Data Collection -> Verification -> Severity -> Allocation -> Shelter -> Replanning.
    Persists the resulting disaster events, logs, allocations, and shelter assignments to the DB.
    """
    logger.info(f"⚡ Ingesting manual orchestration trigger at: {payload.location_label} ({payload.latitude}, {payload.longitude})")
    try:
        from workflows.graph import run_graph
        
        # Build initial state dict
        initial_state = {
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "location_label": payload.location_label,
            "country": payload.country
        }
        
        # Handle custom real-time disaster injection
        if payload.disaster_title and payload.disaster_type:
            logger.info(f"💉 Injecting simulated real-time disaster event for scraping: {payload.disaster_title} ({payload.disaster_type})")
            
            from datetime import timezone
            
            # Map type to GDACS code
            event_type_map = {"Flood": "FL", "Cyclone": "TC", "Earthquake": "EQ", "Wildfire": "WF", "Heatwave": "HW"}
            g_code = event_type_map.get(payload.disaster_type, "FL")
            
            if payload.disaster_type == "Earthquake":
                injected_eq = {
                    "usgs_id": f"injected-eq-{uuid.uuid4().hex[:8]}",
                    "usgs_url": "https://earthquake.usgs.gov",
                    "magnitude": 6.5, # Default moderate-strong magnitude for verification
                    "magnitude_type": "Mw",
                    "depth_km": 10.0,
                    "depth_label": "Shallow",
                    "latitude": payload.latitude,
                    "longitude": payload.longitude,
                    "place": payload.location_label,
                    "country": payload.country or "India",
                    "severity_mapped": "High",
                    "event_time": datetime.now(timezone.utc).isoformat(),
                    "event_time_ist": datetime.now(timezone.utc).isoformat(),
                    "felt_reports": 120,
                    "tsunami_risk": False,
                    "alert_level": "Orange",
                    "significance": 650,
                    "source": "LIVE", # LIVE source triggers real news search in verification agent!
                    "source_url": "https://earthquake.usgs.gov"
                }
                initial_state["earthquake_events"] = [injected_eq]
            else:
                injected_event = {
                    "event_id": f"injected-{uuid.uuid4().hex[:8]}",
                    "event_type": g_code,
                    "event_type_label": payload.disaster_type,
                    "alert_level": "Red",
                    "severity_mapped": "High",
                    "alert_score": 3.5,
                    "country": payload.country or "India",
                    "latitude": payload.latitude,
                    "longitude": payload.longitude,
                    "title": payload.disaster_title,
                    "description": f"Real-time ingestion for {payload.disaster_title}",
                    "url": "https://www.gdacs.org",
                    "affected_population": 12000,
                    "event_date": datetime.now(timezone.utc).isoformat(),
                    "source": "LIVE", # LIVE source triggers real news search in verification agent!
                    "source_url": "https://www.gdacs.org"
                }
                initial_state["disaster_events"] = [injected_event]
        
        # Run graph
        result = run_graph(initial_state)
        
        if result.get("status") != "success":
            raise HTTPException(status_code=500, detail=f"Orchestration failure: {result.get('error_message')}")
            
        final_state = result["state"]
        
        # 1. Persist verified reports as disasters
        verified_reports = final_state.get("verified_reports") or []
        created_disasters = []
        
        # If no verified reports were found, return nominal monitoring state
        if not verified_reports:
            return {
                "system_state": "nominal",
                "confidence_score": 0,
                "severity_level": "LOW",
                "verification_status": "NO_ACTIVE_DISASTER",
                "status": "success",
                "severity": "Low",
                "confidence": 0,
                "resources_allocated": False,
                "shelters_assigned": False,
                "session_id": final_state.get("session_id"),
                "disasters_created": [],
                "replanning_actions": [],
                "recommendations": ["System is operating in nominal monitoring mode."],
                "node_trace": final_state.get("metadata", {}).get("nodes_visited", []),
                "state": final_state
            }
        else:
            for rep in verified_reports:
                title = rep.get("disaster_title")
                existing = db.query(Disaster).filter(Disaster.title == title).first()
                if not existing:
                    d_type = DisasterType.FLOOD
                    title_l = title.lower()
                    if "earthquake" in title_l or "quake" in title_l:
                        d_type = DisasterType.EARTHQUAKE
                    elif "cyclone" in title_l or "storm" in title_l or "typhoon" in title_l:
                        d_type = DisasterType.CYCLONE
                    elif "fire" in title_l or "wildfire" in title_l:
                        d_type = DisasterType.WILDFIRE
                        
                    disaster = Disaster(
                        title=title,
                        disaster_type=d_type,
                        severity=SeverityLevel(final_state.get("severity_level", "Medium")),
                        status=DisasterStatus.ACTIVE,
                        latitude=payload.latitude,
                        longitude=payload.longitude,
                        affected_population=1200,
                        confidence_score=rep.get("consensus_confidence", 0.5),
                        verification_status=VerificationStatus.VERIFIED,
                        source=rep.get("sources_checked", ["GDACS"])[0],
                        source_type=SourceType.GDACS
                    )
                    db.add(disaster)
                    db.commit()
                    db.refresh(disaster)
                    existing = disaster
                created_disasters.append(existing)
                
                # Create verification log
                for src in rep.get("sources_checked") or []:
                    log_exists = db.query(VerificationLog).filter(
                        VerificationLog.disaster_id == existing.id,
                        VerificationLog.source_checked == src
                    ).first()
                    if not log_exists:
                        v_log = VerificationLog(
                            disaster_id=existing.id,
                            source_checked=src,
                            result=rep.get("verification_result", "Verified"),
                            confidence=rep.get("consensus_confidence", 0.8),
                            notes=rep.get("verification_notes", "Orchestrated pipeline run verification")
                        )
                        db.add(v_log)
                
        # 2. Persist resource allocations
        alloc_plan = final_state.get("allocation_plan") or {}
        allocations_list = alloc_plan.get("allocations") or []
        primary_disaster = created_disasters[0] if created_disasters else None
        
        if primary_disaster and allocations_list:
            for alloc in allocations_list:
                res_id_str = alloc.get("resource_id")
                try:
                    res_id = uuid.UUID(res_id_str)
                    db_res = db.query(Resource).filter(Resource.id == res_id).first()
                    if db_res:
                        existing_alloc = db.query(ResourceAllocation).filter(
                            ResourceAllocation.disaster_id == primary_disaster.id,
                            ResourceAllocation.resource_id == res_id
                        ).first()
                        
                        if not existing_alloc:
                            allocation_record = ResourceAllocation(
                                disaster_id=primary_disaster.id,
                                resource_id=res_id,
                                quantity=alloc.get("quantity", 1),
                                allocation_reason=alloc.get("reason", "Pipeline allocated"),
                                status=AllocationStatus.ACTIVE
                            )
                            db.add(allocation_record)
                            db_res.status = ResourceStatus.BUSY
                except Exception as ex:
                    logger.warning(f"Could not persist allocation for resource {res_id_str}: {ex}")
                    
        # 3. Persist shelter assignments
        shelter_plan = final_state.get("shelter_plan") or {}
        assigned_shelters = shelter_plan.get("assigned_shelters") or []
        if assigned_shelters:
            for ash in assigned_shelters:
                sh_id_str = ash.get("shelter_id")
                if sh_id_str != "temp-camp-delta":
                    try:
                        sh_id = uuid.UUID(sh_id_str)
                        db_shelter = db.query(Shelter).filter(Shelter.id == sh_id).first()
                        if db_shelter:
                            db_shelter.occupied = min(db_shelter.capacity, db_shelter.occupied + ash.get("assigned_people", 0))
                    except Exception as ex:
                        logger.warning(f"Could not update occupancy for shelter {sh_id_str}: {ex}")
                        
        # 4. Persist alerts
        weather_d = final_state.get("weather_data") or {}
        if weather_d.get("rainfall_mm", 0.0) >= 50.0:
            rain_alert = Alert(
                title="Torrential Rainfall Inundation",
                severity=SeverityLevel.CRITICAL,
                message=f"Heavy rain of {weather_d.get('rainfall_mm')} mm/hr has triggered flash-flood warnings.",
                source="Open-Meteo",
                source_type=SourceType.OPENMETEO,
                confidence_score=0.95
            )
            db.add(rain_alert)
            
        # Commit all DB operations
        db.commit()
        
        return {
            "status": "success",
            "severity": result["severity"],
            "confidence": result["confidence"],
            "resources_allocated": result["resources_allocated"],
            "shelters_assigned": result["shelters_assigned"],
            "session_id": final_state.get("session_id"),
            "disasters_created": [str(d.id) for d in created_disasters],
            "replanning_actions": final_state.get("replanning_actions", []),
            "recommendations": final_state.get("recommendations", []),
            "node_trace": final_state.get("metadata", {}).get("nodes_visited", []),
            "state": final_state
        }
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error during orchestration execution endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class DemoRunPayload(BaseModel):
    scenario: str = Field(..., description="Supported scenarios: 'Mumbai Flood', 'Gujarat Cyclone', 'Kashmir Earthquake'")
    severity: Optional[str] = Field(None, description="Optional severity override")


@app.post("/api/demo/run", tags=["Demo"])
def run_demo_scenario(payload: DemoRunPayload, db: Session = Depends(get_db)):
    """
    Triggers the complete LangGraph ADCC orchestration pipeline in Demo Mode.
    Injects pre-seeded scenario state, bypassing live API calls and scraping.
    Persists resulting events (marked with source='DEMO'), allocations, and shelter assignments.
    """
    from services.demo_helper import get_demo_scenario
    from datetime import datetime, timezone
    
    scenario = get_demo_scenario(payload.scenario)
    if not scenario:
        raise HTTPException(
            status_code=400,
            detail=f"Scenario '{payload.scenario}' not supported. Choose one of: 'Mumbai Flood', 'Gujarat Cyclone', 'Kashmir Earthquake'."
        )
    
    logger.info(f"🎭 Triggering Demo Scenario: {payload.scenario}")
    try:
        from workflows.graph import run_graph
        
        # 1. Construct weather state
        weather_info = scenario["weather"]
        weather_state = {
            "latitude": scenario["latitude"],
            "longitude": scenario["longitude"],
            "location_label": scenario["title"],
            "temperature_c": weather_info["temperature_c"],
            "rainfall_mm": weather_info["rainfall_mm"],
            "humidity_percent": weather_info["humidity_percent"],
            "wind_speed_kmh": weather_info["wind_speed_kmh"],
            "wind_direction_deg": 0.0,
            "weather_description": weather_info["weather_description"],
            "is_day": True,
            "flood_risk": weather_info["flood_risk"],
            "cyclone_risk": weather_info["cyclone_risk"],
            "forecast_days": 7,
            "max_rainfall_mm": weather_info["rainfall_mm"] * 1.5,
            "max_wind_kmh": weather_info["wind_speed_kmh"] * 1.1,
            "flood_risk_hours": 12 if weather_info["flood_risk"] else 0,
            "risk_summary": f"Simulated demo risk for {payload.scenario}.",
            "source": "Open-Meteo",
            "source_url": "https://open-meteo.com",
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }
        
        # 2. Construct events
        disaster_events = []
        earthquake_events = []
        
        if scenario["disaster_type"] == "Earthquake":
            eq_info = scenario["earthquake"]
            eq_event = {
                "usgs_id": "demo-kashmir-eq",
                "usgs_url": "https://earthquake.usgs.gov",
                "magnitude": eq_info["magnitude"],
                "magnitude_type": "Mw",
                "depth_km": eq_info["depth_km"],
                "depth_label": eq_info["depth_label"],
                "latitude": scenario["latitude"],
                "longitude": scenario["longitude"],
                "place": eq_info["place"],
                "country": "India",
                "severity_mapped": payload.severity or scenario["default_severity"],
                "event_time": datetime.now(timezone.utc).isoformat(),
                "event_time_ist": datetime.now(timezone.utc).isoformat(),
                "felt_reports": 850,
                "tsunami_risk": False,
                "alert_level": "red",
                "significance": 1000,
                "source": "DEMO",
                "source_url": "https://earthquake.usgs.gov"
            }
            earthquake_events.append(eq_event)
        else:
            # Flood or Cyclone
            event_type_map = {"Flood": "FL", "Cyclone": "TC"}
            g_event = {
                "event_id": f"demo-{scenario['disaster_type'].lower()}",
                "event_type": event_type_map.get(scenario["disaster_type"], "FL"),
                "event_type_label": scenario["disaster_type"],
                "alert_level": "Red",
                "severity_mapped": payload.severity or scenario["default_severity"],
                "alert_score": 3.5,
                "country": "India",
                "latitude": scenario["latitude"],
                "longitude": scenario["longitude"],
                "title": scenario["title"],
                "description": weather_info["weather_description"],
                "url": "https://www.gdacs.org",
                "affected_population": scenario["affected_population"],
                "event_date": datetime.now(timezone.utc).isoformat(),
                "source": "DEMO",
                "source_url": "https://www.gdacs.org"
            }
            disaster_events.append(g_event)
            
        # Build initial state dict
        initial_state = {
            "is_demo": True,
            "latitude": scenario["latitude"],
            "longitude": scenario["longitude"],
            "location_label": scenario["title"],
            "country": "India",
            "weather_data": weather_state,
            "disaster_events": disaster_events,
            "earthquake_events": earthquake_events,
        }
        
        # Run graph
        result = run_graph(initial_state)
        
        if result.get("status") != "success":
            raise HTTPException(status_code=500, detail=f"Demo Orchestration failure: {result.get('error_message')}")
            
        final_state = result["state"]
        
        # 1. Persist verified reports as disasters (marked with source="DEMO")
        verified_reports = final_state.get("verified_reports") or []
        created_disasters = []
        
        if not verified_reports:
            # Fallback in case of verification discrepancy
            disaster = Disaster(
                title=scenario["title"],
                disaster_type=DisasterType(scenario["disaster_type"]),
                severity=SeverityLevel(final_state.get("severity_level", scenario["default_severity"])),
                status=DisasterStatus.ACTIVE,
                latitude=scenario["latitude"],
                longitude=scenario["longitude"],
                affected_population=scenario["affected_population"],
                confidence_score=scenario["confidence_score"],
                verification_status=VerificationStatus.VERIFIED,
                source="DEMO",
                source_type=SourceType.MANUAL
            )
            db.add(disaster)
            db.commit()
            db.refresh(disaster)
            created_disasters.append(disaster)
        else:
            for rep in verified_reports:
                title = rep.get("disaster_title")
                existing = db.query(Disaster).filter(Disaster.title == title, Disaster.source == "DEMO").first()
                if not existing:
                    disaster = Disaster(
                        title=title,
                        disaster_type=DisasterType(scenario["disaster_type"]),
                        severity=SeverityLevel(final_state.get("severity_level", scenario["default_severity"])),
                        status=DisasterStatus.ACTIVE,
                        latitude=scenario["latitude"],
                        longitude=scenario["longitude"],
                        affected_population=scenario["affected_population"],
                        confidence_score=rep.get("consensus_confidence", 0.95),
                        verification_status=VerificationStatus.VERIFIED,
                        source="DEMO",
                        source_type=SourceType.MANUAL
                    )
                    db.add(disaster)
                    db.commit()
                    db.refresh(disaster)
                    existing = disaster
                created_disasters.append(existing)
                
                # Create verification log
                for src in rep.get("sources_checked") or []:
                    log_exists = db.query(VerificationLog).filter(
                        VerificationLog.disaster_id == existing.id,
                        VerificationLog.source_checked == src
                    ).first()
                    if not log_exists:
                        v_log = VerificationLog(
                            disaster_id=existing.id,
                            source_checked=src,
                            result=rep.get("verification_result", "Verified"),
                            confidence=rep.get("consensus_confidence", 0.95),
                            notes=rep.get("verification_notes", "Demo pipeline run verification")
                        )
                        db.add(v_log)
                        
        # 2. Persist resource allocations
        alloc_plan = final_state.get("allocation_plan") or {}
        allocations_list = alloc_plan.get("allocations") or []
        primary_disaster = created_disasters[0] if created_disasters else None
        
        if primary_disaster and allocations_list:
            for alloc in allocations_list:
                res_id_str = alloc.get("resource_id")
                try:
                    res_id = uuid.UUID(res_id_str)
                    db_res = db.query(Resource).filter(Resource.id == res_id).first()
                    if db_res:
                        existing_alloc = db.query(ResourceAllocation).filter(
                            ResourceAllocation.disaster_id == primary_disaster.id,
                            ResourceAllocation.resource_id == res_id
                        ).first()
                        
                        if not existing_alloc:
                            allocation_record = ResourceAllocation(
                                disaster_id=primary_disaster.id,
                                resource_id=res_id,
                                quantity=alloc.get("quantity", 1),
                                allocation_reason=alloc.get("reason", "Demo Pipeline allocated"),
                                status=AllocationStatus.ACTIVE
                            )
                            db.add(allocation_record)
                            db_res.status = ResourceStatus.BUSY
                except Exception as ex:
                    logger.warning(f"Could not persist allocation for resource {res_id_str}: {ex}")
                    
        # 3. Persist shelter assignments
        shelter_plan = final_state.get("shelter_plan") or {}
        assigned_shelters = shelter_plan.get("assigned_shelters") or []
        if assigned_shelters:
            for ash in assigned_shelters:
                sh_id_str = ash.get("shelter_id")
                if sh_id_str != "temp-camp-delta":
                    try:
                        sh_id = uuid.UUID(sh_id_str)
                        db_shelter = db.query(Shelter).filter(Shelter.id == sh_id).first()
                        if db_shelter:
                            db_shelter.occupied = min(db_shelter.capacity, db_shelter.occupied + ash.get("assigned_people", 0))
                    except Exception as ex:
                        logger.warning(f"Could not update occupancy for shelter {sh_id_str}: {ex}")
                        
        db.commit()
        
        return {
            "verified_reports": final_state.get("verified_reports", []),
            "severity_score": final_state.get("severity_score", 0.0),
            "allocation_plan": final_state.get("allocation_plan"),
            "shelter_plan": final_state.get("shelter_plan"),
            "replanning_actions": final_state.get("replanning_actions", []),
            "node_trace": final_state.get("metadata", {}).get("nodes_visited", []),
            "disasters_created": [str(d.id) for d in created_disasters]
        }
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error during demo orchestration execution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", tags=["System"])
def root():
    return {
        "name": "ADCC — Autonomous Disaster Command Center API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "operational",
    }
