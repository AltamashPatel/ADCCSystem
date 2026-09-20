***Far Away Hackathon Submission***  
**Theme:** *Agentic and Autonomous Systems*

# 🌋🛡️ ADCC — Autonomous Disaster Command Center

ADCC (Autonomous Disaster Command Center) is an intelligent, multi-agent AI system designed for real-time disaster monitoring, validation, severity assessment, resource allocation, and dynamic evacuation orchestration. It acts as an automated "digital twin" command center, coordinating emergency responses between live external feeds, field resources, relief shelters, and government agencies.

The system is split into:
1. **React Frontend Dashboard**: A sleek, animated dashboard built with **Vite, TypeScript, TailwindCSS (v4), Framer Motion, and Recharts**.
2. **FastAPI Backend**: A high-performance Python backend serving REST APIs, executing simulations, and orchestrating LangGraph agents powered by **Google Gemini**.

---

## 🖼️ User Interface Previews

Below are the visual interfaces of the Autonomous Disaster Command Center:

### 1. Operations Dashboard
*The central command board showcasing active emergencies, recent alert dispatch feeds, resource inventory counts, and key metrics.*
<img width="1918" height="903" alt="image" src="https://github.com/user-attachments/assets/aa721201-072c-4b6b-afa4-d913a7c34fd7" />


### 2. Real-time GIS Disaster Map
*An interactive geospatial map showcasing active disaster coordinates, hospitals, shelter locations, and safe evacuation corridors.*
<img width="1918" height="917" alt="image" src="https://github.com/user-attachments/assets/a7bb35db-9a37-4d26-9c52-bd7d1b2cb400" />


### 3. AI Command Center
*The live execution window displaying node-by-node LangGraph agent loops alongside a conversational chatbot to ask recommendations.*
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/8e7293d5-7c3b-4dbf-b9d8-da2b1ea9aefa" />

---

## 📂 Project Folder Structure

The repository is structured as a monorepo, containing the React frontend in the root and the Python AI agent backend in the `disaster-ai/` subdirectory:

```text
ADCCSystem/
│
├── disaster-ai/                 # 🐍 PYTHON AI BACKEND
│   ├── app.py                   # Main FastAPI entry point & API routes
│   ├── requirements.txt         # Backend Python dependencies
│   ├── .env.example             # Template for backend secrets & keys
│   │
│   ├── agents/                  # 🤖 Multi-agent orchestrators
│   │   ├── supervisor_agent.py  # Central routing agent (evaluates State & directs sub-agents)
│   │   ├── data_collection_agent.py # Ingests external API feeds (weather, news, USGS, etc.)
│   │   ├── verification_agent.py    # Cross-references feeds to validate incident credibility
│   │   ├── severity_agent.py    # Evaluates hazard magnitude, exposure, and population risk
│   │   ├── allocation_agent.py  # Dispatches emergency resources (ambulances, boats, etc.)
│   │   ├── shelter_agent.py     # Manages relief camp capacities & evacuation targets
│   │   ├── route_planning_agent.py  # Calculates evacuation corridors & assembly points
│   │   ├── replanning_agent.py  # Listens for updates (e.g. road blocks) and updates paths
│   │   ├── notification_agent.py # Dispatches alerts to responders and citizens
│   │   └── command_center.py    # Generates natural language summaries & explanations
│   │
│   ├── tools/                   # 🛠️ Integration Tools & API Wrappers
│   │   ├── weather_tool.py      # Connects to weather forecast services (Open-Meteo)
│   │   ├── gdacs_tool.py        # Fetches live alerts from the Global Disaster Alert System
│   │   ├── disaster_tool.py     # Pulls real-time seismic data from USGS
│   │   ├── news_tool.py         # Gathers hyper-local media stories via NewsAPI
│   │   ├── route_tool.py        # Coordinates route matrices & paths (OpenRouteService)
│   │   ├── satellite_tool.py    # Integrates earth observation imagery (Sentinel Hub)
│   │   ├── resource_tool.py     # Interfaces with local warehouse database inventories
│   │   ├── notification_tool.py # Connects to SMS/WhatsApp dispatch networks (Twilio)
│   │   └── social_media_tool.py # Monitors citizen feeds and processes NLP sentiment
│   │
│   ├── workflows/               # 🔄 LangGraph State & Node Definitions
│   │   ├── graph.py             # Defines the StateGraph architecture and routing
│   │   ├── state.py             # Defines DisasterState (single shared-state object)
│   │   └── nodes.py             # Wraps agent execution inside LangGraph nodes
│   │
│   ├── services/                # ⚙️ Business Logic & Engines
│   │   ├── confidence_engine.py # Algorithms scoring report reliability across sources
│   │   ├── simulation_engine.py # Runs Digital Twin scenario simulations (rainfall/population tweaks)
│   │   └── normalizer.py        # Standardizes raw payload inputs
│   │
│   └── database/                # 🗄️ Database Schemas & Migrations
│       ├── models.py            # PostgreSQL tables & SQLAlchemy ORM mapping
│       ├── postgres.py          # Connection pool configurations & SQLite fallback
│       └── seed_data.py         # Bootstraps mock disasters, hospitals, NDRF units, and shelters
│
├── src/                         # ⚛️ REACT + VITE + TS FRONTEND
│   ├── main.tsx                 # Frontend application entrypoint
│   ├── App.tsx                  # Base layout router
│   ├── index.css                # Global styles & Tailwind v4 configurations
│   ├── pages/                   # Dashboard screens
│   │   ├── Dashboard.tsx        # Overview page showing metrics, graphs, and system status
│   │   ├── AICommandCenter.tsx  # Live monitoring feed & agent iteration traces
│   │   ├── DisasterMap.tsx      # Geospatial Leaflet map showcasing incident pins & routes
│   │   ├── Resources.tsx        # Emergency resources list & allocation controls
│   │   ├── Simulation.tsx       # Controls for running Digital Twin scenario simulations
│   │   ├── Agents.tsx           # Status and activity logs of the sub-agents
│   │   ├── Analytics.tsx        # Statistical breakdowns of past incidents & response speeds
│   │   └── Settings.tsx         # Backend environment variables configuration panel
│   │
│   ├── components/              # Shared reusable UI elements
│   ├── layouts/                 # Header, Sidebar, and Page Shell layout templates
│   ├── contexts/                # Theme and Global State providers
│   ├── services/                # API client wrappers (Axios integrations with backend)
│   └── routes/                  # Route paths definition
│
├── vite.config.ts               # Vite bundler configurations
├── package.json                 # Frontend scripts and node dependencies
└── tsconfig.json                # TypeScript compiler config
```

---

## 🤖 Agentic AI Architecture

ADCC features a **Supervisor-driven Multi-Agent Hierarchy** built with LangGraph. Instead of a hardcoded linear sequence, the system leverages a central orchestrator to evaluate the situation dynamically and execute parallel actions.

```mermaid
graph TD
    START([START]) --> SV[Supervisor Agent]
    
    %% Supervisor Decisions
    SV -- Evaluate State --> decision{Decide Next Steps}
    
    %% Parallel Fan-out / Routing
    decision -- "Collect Feeds" --> DC[Data Collection Agent]
    decision -- "Verify Report" --> VR[Verification Agent]
    decision -- "Assess Impact" --> SA[Severity Agent]
    decision -- "Deploy Gear (Parallel)" --> AL[Allocation Agent]
    decision -- "Evacuate camps (Parallel)" --> SH[Shelter Agent]
    decision -- "Plot routes" --> RP[Route Planning Agent]
    decision -- "Dispatch Alerts" --> NT[Notification Agent]
    decision -- "Situational Change" --> RE[Replanning Agent]
    decision -- "Workflow Complete" --> CC[Command Center Agent]
    
    %% Report Back
    DC --> SV
    VR --> SV
    SA --> SV
    AL --> SV
    SH --> SV
    RP --> SV
    NT --> SV
    RE --> SV
    CC --> SV
    
    SV -- "is_done = true" --> END([END])
```

### Sub-Agent Responsibilities:
* **Supervisor Agent (`supervisor_agent.py`)**: The router. It inspects the `DisasterState` context and decides which sub-agents must run next or in parallel.
* **Data Collection Agent (`data_collection_agent.py`)**: Gathers external inputs (meteorological trends, USGS earthquakes, news feeds).
* **Verification Agent (`verification_agent.py`)**: Uses a custom **Confidence Engine** to score reports and filter out duplicates or false alarms.
* **Severity Agent (`severity_agent.py`)**: Computes hazard impact indices (0.0 to 1.0) and translates them into qualitative levels (*Low, Medium, High, Critical*).
* **Allocation Agent (`allocation_agent.py`)**: Evaluates proximity metrics of active National Disaster Response Force (NDRF) teams and dispatches equipment/supplies.
* **Shelter Agent (`shelter_agent.py`)**: Dispatches evacuees to surrounding camps based on safety zones and occupancy status.
* **Route Planning Agent (`route_planning_agent.py`)**: Outlines evacuation corridors using route-network calculations.
* **Replanning Agent (`replanning_agent.py`)**: Monitors ongoing crisis updates and dynamically triggers alternative pathways if roadblocks occur.
* **Notification Agent (`notification_agent.py`)**: Dispatches automated emergency broadcasts (SMS/WhatsApp) using communication networks.
* **Command Center Agent (`command_center.py`)**: Generates natural language incident analysis summaries for operators using Gemini.

---

## 🛠️ Tool Layer

The **Tool Layer** isolates external API wrappers, ensuring the agents interact with consistent, typed inputs and outputs. If an external service goes offline or updates its schema, changes are restricted solely to the corresponding tool in this layer:

| Tool | Source API | Purpose |
| :--- | :--- | :--- |
| **Weather Tool** | Open-Meteo API | Fetches local temperature, wind speeds, hourly rain forecasts, and generates alert indicators (flood, cyclone). |
| **GDACS Tool** | GDACS RSS Feed | Monitors live global alerts regarding floods, volcanic eruptions, tropical cyclones, and wildfires. |
| **Disaster Tool** | USGS GeoJSON Feed | Streams real-time global seismic updates, filtering events by magnitude and coordinates. |
| **News Tool** | NewsAPI | Extracts local journalistic reports matching the disaster location to confirm reports. |
| **Route Tool** | OpenRouteService (ORS) | Generates optimal routing coordinates, travel durations, and road-distance calculations. |
| **Satellite Tool** | Sentinel Hub API | Requests Earth-observation imagery bands to visualize flooding outlines and fire perimeters. |
| **Resource Tool** | Database Client | Interrogates local SQL tables to identify current available NDRF teams, ambulances, and food inventory levels. |
| **Notification Tool**| Twilio | Sends text-based alerts containing evacuation instructions to emergency dispatch and local residents. |
| **Social Media Tool**| News & Twitter Scrapers| Monitors posts for hyper-local activity, evaluating sentiment using natural language filters. |

---

## 🔄 Agentic Workflow

The workflow utilizes LangGraph's state graph compilation. All nodes share a common state context defined as `DisasterState` (`workflows/state.py`).

1. **State Initialization**: The graph is triggered with coordinates (Latitude, Longitude) and a Location Label. A unique `session_id` is assigned.
2. **Supervisor Loop**:
   - The Supervisor examines the state.
   - If the incoming feeds are missing, it queues the `Data Collection Agent`.
   - If the report requires confirmation, it queues the `Verification Agent`.
   - Once verified, the `Severity Agent` determines the risk score.
   - If the hazard level is evaluated as **High** or **Critical**, the supervisor initiates a **Parallel Fan-out**, executing both `Allocation Agent` (resource matching) and `Shelter Agent` (capacity assignments) simultaneously.
   - The `Route Planning Agent` maps evacuation trails based on these assignments.
   - The `Notification Agent` triggers Twilio updates, setting `notification_sent = true` to prevent duplicates.
   - The `Command Center Agent` synthesizes a natural language briefing.
3. **Completion**: When all agents have finished execution and the summary is compiled, the supervisor marks the decision status as `is_done = true`, routing the graph to `END`.
4. **Safety Counter**: The graph includes a safety threshold capping the loop at `10 iterations`. If an infinite routing loop is detected, execution is aborted, and emergency states are saved.

---

## 🚀 Getting Started

Follow these steps to run both the backend FastAPI server and the React frontend dashboard locally:

### 1. Prerequisites
* **Python**: Version `3.10` or higher.
* **Node.js**: Version `18.0` or higher (includes `npm`).
* **Database**: PostgreSQL (recommended) or falls back to a local SQLite instance (`adcc_sqlite.db`) if a live PostgreSQL connection isn't configured.

---

### 2. Backend Setup (FastAPI + AI Agents)

1. Navigate to the backend directory:
   ```bash
   cd disaster-ai
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # On macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
5. Open `.env` and provide your credentials:
   ```env
   # Database connection string (PostgreSQL)
   DATABASE_URL=postgresql://postgres:password@localhost:5432/adcc_db

   # AI Agent model authorization
   GOOGLE_API_KEY=your_google_gemini_api_key

   # Tool APIs (Optional but recommended for full tool functionality)
   NEWS_API_KEY=your_news_api_key
   ORS_API_KEY=your_openrouteservice_api_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```
6. Run the FastAPI backend:
   ```bash
   uvicorn app:app --reload
   ```
   * *Note: On startup, the backend automatically connects to the database, creates the required SQL tables, and seeds mock data (hospitals, resources, NDRF units, shelters) if the tables are empty.*
   * You can test that the API is running by loading the interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal in the root directory (`ADCCSystem/`):
   ```bash
   cd ..
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite local dev server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (usually `http://localhost:5173`).

### 🛡️ Dashboard Features & Usage
* **Dashboard Overview**: Check aggregate live alerts, resource utilization stats, and active disaster statuses.
* **AI Command Center**: Trigger manual disaster runs by feeding coordinates, and observe the live LangGraph iteration traces as agents evaluate and report back.
* **Disaster Map**: View real-time USGS earthquake and weather alert coordinates mapped geographically, featuring optimal evacuation trails.
* **Simulations**: Test scenario modifications (e.g. increase rainfall parameter by 50% or raise wind levels) and run Digital Twin forecasting simulations.

---

## 🔍 Verifying the System (How to Check it's Working)

You can verify that the frontend, backend, and agentic workflows are operating correctly using these testing mechanisms:

### 1. Standalone Backend Agentic Run (No UI Needed)
Verify the LangGraph execution, database integration, and Google Gemini connection via CLI:
```bash
cd disaster-ai
# On Windows (PowerShell)
$env:PYTHONPATH="."; python workflows/graph.py

# On macOS/Linux
PYTHONPATH=. python workflows/graph.py
```
* **Expected Result**: The console will run a standalone simulation for a "Guwahati Flood Zone" case, outputting a complete supervisor iteration log and JSON results containing severity assessments, allocated resource IDs, and AI recommendations.

### 2. Verify FastAPI Endpoints & Health Check
* **Health API**: Visit `http://localhost:8000/health` in your browser.
  - **Expected JSON**:
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "stats": {
        "disasters": 4,
        "resources": 12
      }
    }
    ```
* **Swagger API UI**: Visit `http://localhost:8000/docs`. You can manually invoke endpoints (like `POST /api/disasters` or `GET /api/allocations`) directly from the browser to inspect live database values.

### 3. Run a Live Agent Flow via React UI
1. Navigate to the **AI Command Center** page (`http://localhost:5173/command-center`).
2. Input target coordinates or click one of the quick start scenario templates.
3. Click the **Run Agentic Simulation** button.
4. Watch the live **LangGraph Trace panel** dynamically light up node by node (e.g., `collect_data` ➔ `verification` ➔ `severity` ➔ parallel `allocation` & `shelter` ➔ `command_center`) as the agents cooperate.

---

## 📌 MVP Status & Future Enhancements

> [!IMPORTANT]
> **MVP Status Note**: This system is currently built as a **Minimum Viable Product (MVP)**. It establishes the foundational multi-agent routing architecture (using LangGraph), demonstrates real-world API integrations (Weather, GDACS, USGS, Twilio), and simulates resource allocation strategies. The final, production-ready product will feature much deeper capabilities and robust systems.

### 🔮 Future Enhancements
* **Real-time IoT Sensor Feeds**: Replace periodic API sweeps with direct WebSocket pipelines streaming real-time data from river water-level sensors, rain gauges, and seismic trackers.
* **Computer Vision Satellite Mapping**: Integrate vision models (e.g., Gemini Pro Vision) to automatically scan Sentinel-2 satellite images and output precise flood outline contours and structural damage maps.
* **GIS Evacuation Routing & Road Obstacles**: Integrate with live maps telemetry data (like Waze or local road authorities) to dynamically update route options if bridges collapse or lanes flood during a crisis.
* **Voice-Activated Dispatch & Citizen Intake**: Support automated hotlines that record spoken distress calls, transcribe them via Speech-to-Text, and feed them directly into the Data Collection Agent for verification.
* **Operational Offline/Resilient Mode**: Implement fallback caching layers and sync capabilities so emergency field workers can log data offline using light SQLite local stores when cell tower networks go down.

---

## 🔒 API Key Consumption & Cost Prevention (Public Hosting Guide)

When hosting this application on public servers (e.g., Vercel, Render, AWS, Heroku) for public showcase, leaving your personal API keys (like Google Gemini, Twilio, NewsAPI, Sentinel Hub) in the backend `.env` variables runs the risk of **credit exhaustion, unexpected billing, or rate-limiting** due to automated bots or high user traffic. 

Here are the standard solutions implemented in ADCC to safeguard your keys, alongside recommendations for public hosting:

### 1. "Bring Your Own Key" (BYOK) Pass-Through (Recommended)
Rather than executing agent calls via the host's server-side key, configure the system to let users input their own API keys:
* **How it works**:
  1. The user navigates to the **Settings** page (`http://localhost:5173/settings`) and inputs their personal Gemini key (`GOOGLE_API_KEY`) and other credentials.
  2. The React frontend saves these keys securely inside the client's browser local storage (`localStorage.setItem('gemini_api_key', key)`).
  3. The Axios client wrapper ([api.ts](file:///c:/Projects/python%20projects/mudassir/ADCCSystem/src/services/api.ts)) intercepts requests and attaches these values as headers:
     ```typescript
     // Example HTTP Request Headers
     headers: {
       'X-Gemini-API-Key': localStorage.getItem('gemini_api_key') || '',
       'X-ORS-API-Key': localStorage.getItem('ors_api_key') || ''
     }
     ```
  4. The FastAPI backend reads these headers at endpoint execution. If present, it overrides the default `.env` variables for that specific request session. If missing, it prompts the user to enter a key.

### 2. Sandbox / Demo Mode Toggle
* **Backend Env Toggle**: You can set `DEMO_MODE=true` in the backend environment.
* **Mechanism**: In Demo Mode, the orchestration node wrappers in the backend bypass external LLM/Twilio API dispatches entirely. Instead of making live Gemini requests, it routes through static, cached scenario structures (e.g., the mock paths generated by `services/demo_helper.py`). This allows anyone to click around the dashboard and review agent nodes free of charge.

### 3. Server-Side Rate Limiting (Throttling)
* If you do decide to provide a limited, public "free tier" using your server keys, protect the backend from abuse using rate-limiting middleware:
  - Install `slowapi` on the FastAPI backend:
    ```bash
    pip install slowapi
    ```
  - Limit the `/api/orchestration/run` and chat endpoint to a strict threshold:
    ```python
    @app.post("/api/orchestration/run")
    @limiter.limit("5/hour")  # Max 5 simulations per IP per hour
    async def run_orchestration(request: Request):
        ...
    ```

### 4. External Data Source Caching
* External data sweeps (Weather feeds from Open-Meteo, USGS earthquakes, GDACS alerts) are cached in the PostgreSQL database for **1–2 hours** inside the `ApiSyncLog` and `Disaster` models.
* Subsequent coordination runs in nearby coordinates look up the cached database records first, avoiding repeated billable hits to news or satellite APIs.

