# FootprintESG — Enterprise Carbon Accounting & ESG Management System
## Architecture, File Directory & Operational Documentation

---

### 1. System Overview
**FootprintESG** is an enterprise GHG Protocol-compliant corporate sustainability platform. It enables multi-facility corporations to track Scope 1 (Direct combustion, refrigerants), Scope 2 (Purchased electricity via market and location-based emission factors), and core Scope 3 business activities.

Key Capabilities:
- **GHG Emissions Inventory**: Live metric tonnes CO₂e calculation based on DEFRA / US EPA / IEA emission factors.
- **SBTi Target Trajectory (Science-Based Targets)**: 1.5°C Paris Agreement pathway tracking towards Net-Zero 2030 / 2050 targets.
- **Facility Benchmarking & Energy Intensity**: kWh/sqft and MT CO₂e per revenue dollar across global manufacturing plants.
- **Data Audit Lock & Assurance Trail**: Immutable locking of verified accounting periods with auditor sign-off.
- **BRSR & CSRD Ready Reporting**: One-click ESG disclosures compliant with EU CSRD and SEC climate rules.

---

### 2. Directory Structure & File Map

```
footprint-esg-sustainability/
├── docker-compose.yml              # Orchestration (Mongo:27019, Server:5002, Client:3002)
├── README.md                       # Quickstart documentation
├── docs/                           # Architecture and audit runbooks
│   └── ARCHITECTURE.md             # This document
├── client/                         # React 18 + Vite Frontend Application
│   ├── Dockerfile                  # Multi-stage build (Node 20 build -> Nginx Alpine runtime)
│   ├── nginx.conf                  # Nginx reverse proxy mapping /api to server:5002
│   ├── package.json                # Frontend dependencies (Lucide icons, charts)
│   ├── vite.config.js              # Vite bundler configuration
│   ├── index.html                  # HTML entry point with sleek green-slate typography
│   └── src/
│       ├── App.jsx                 # Executive Carbon KPI, Facility Breakdown, SBTi Progress, Audit Lock
│       ├── index.css               # Clean STRATIS-inspired modern light enterprise theme
│       ├── main.jsx                # React root mount
│       └── mockData.js             # High-fidelity corporate emissions dataset
└── server/                         # Express & Mongoose API Server
    ├── Dockerfile                  # Node.js 20 Alpine container
    ├── package.json                # Backend dependencies (express, mongoose, cors)
    ├── server.js                   # REST API routes, emission calculations, audit trails
    └── seeder.js                   # Seed corporate facilities, Scope 1/2 activities, and SBTi targets
```

---

### 3. Detailed Component Breakdown

#### Backend (`server/`)
- **`server/server.js`**:
  - Express REST API running on port `5002`.
  - MongoDB models for `Facility`, `EmissionRecord`, `SbtiTarget`, `AuditLog`.
  - Core API Routes:
    - `GET /health`: Healthcheck.
    - `GET /api/overview`: Total MT CO₂e, Scope 1 vs Scope 2 breakdown, renewable % energy, YoY reduction.
    - `GET /api/facilities`: Facility list with operational emissions intensity and energy sources.
    - `POST /api/emissions`: Ingest new fuel, gas, or electricity billing records with automatic emission factor application.
    - `GET /api/targets`: SBTi target trajectory vs actual emission reductions.
    - `POST /api/audit/lock-period`: Lock fiscal period for auditor assurance.
- **`server/seeder.js`**:
  - Seeds corporate headquarters and manufacturing facilities (North America Plant, European Hub, Asia Foundry), energy utility bills, and 2030 decarbonization goals.

#### Frontend (`client/`)
- **`client/src/App.jsx`**:
  - Modern, responsive corporate sustainability dashboard:
    1. **Executive Carbon Dashboard**: Scope 1 (Direct), Scope 2 (Location vs Market-based), Renewable Energy % KPI tiles.
    2. **Facility Comparison Matrix**: Energy intensity per square foot and emissions per product unit.
    3. **SBTi 1.5°C Alignment**: Trajectory chart showing actual performance vs 2030 Net Zero milestones.
    4. **Activity Ingestion Form**: Modal to log utility invoices, natural gas meter readings, and fleet fuel.
    5. **Audit Trail & ESG Certification**: Period locking and GHG verification statement generator.

---

### 4. Zero-Dependency Execution via Docker

To run on any recipient laptop with Docker Desktop:
```bash
# 1. Unzip the project folder on the target laptop
cd footprint-esg-sustainability

# 2. Build and launch all 3 containers
docker compose up --build -d

# 3. Access in browser:
# Frontend Dashboard: http://localhost:3002
# Backend Healthcheck: http://localhost:5002/health
# API Overview:       http://localhost:5002/api/overview
```
Port Mappings:
- Client: `3002`
- Server: `5002`
- MongoDB: `27019`
