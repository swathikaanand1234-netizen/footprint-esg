# FootprintESG™ - Environmental Sustainability & ESG Performance Management System

A production-grade, enterprise MERN-stack platform that centralizes global manufacturing energy, water, waste, production output, and Scope 1 & Scope 2 greenhouse gas emissions. Aligned with the **GHG Protocol Corporate Standard**, **ISO 14064-3**, and **SBTi (Science-Based Targets)**.

---

## ✨ Features & Architecture (Completed)

- **Consolidated Corporate Carbon Footprint**: Real-time aggregation of Scope 1 (Direct Fuel, Fleet Diesel, Natural Gas) and Scope 2 (Market-based Purchased Electricity) emissions in metric tons CO2e.
- **Activity Carbon Intensity Tracking**: Calculation of carbon emissions per metric ton of manufactured product (`tCO2e / ton output`).
- **Global Multi-Facility Benchmarking**: Comparative performance league tables across North America, Europe, and Asia-Pacific manufacturing sites.
- **Plant Utility & Feedstock Monitoring**: In-depth monitoring of grid vs. renewable power off-take, water withdrawal vs. recycled volume, and zero-landfill waste diversion rates.
- **SBTi Net-Zero Trajectory Tracking**: 2030 Science-Based Target milestone tracking with status monitoring of capital decarbonization initiatives (rooftop solar, furnace electrification, VPPA wind).
- **Data Governance & Four-Eyes Approval Workflow**: Formal monthly environmental data submission, ESG Controller approval, and tamper-proof audit locking.
- **Third-Party Assurance Logs**: Verification statements and assurance assertions from accredited auditing bodies (Bureau Veritas, DNV GL).
- **Printable GHG Corporate Assertion Scorecard**: Executive reporting scorecard compliant with international climate disclosure frameworks.
- **Zero-Setup Database Seeder**: Automatically initializes 4 global manufacturing plants, historical monthly records, targets, and assurance statements on startup.
- **Anti-Slop Enterprise Design**: Clean light theme inspired by STRATIS, eco-emerald accents (`#059669`), hairline slate borders, and crisp typography.

---

## 🚀 One-Command Launch with Docker (Seamless on Any Laptop)

No setup or configuration required. Run from this folder:

```bash
docker compose up --build
```

- **Frontend Dashboard**: Open [http://localhost:3002](http://localhost:3002)
- **Backend API**: [http://localhost:5002/api/overview](http://localhost:5002/api/overview)
- **MongoDB**: Running internally on port `27019` with persistent volumes

To stop:
```bash
docker compose down
```

---

## ☁️ Deploying to Render (100% Free Tier)

This repository is optimized for Render's **Free Tier** as a unified full-stack service (serving the React dashboard and Express API/Socket.IO from a single free web service, eliminating CORS and domain mismatch).

### 1-Click Render Blueprint (Recommended)
1. Push this repository to GitHub.
2. In the Render Dashboard, click **New +** -> **Blueprint**.
3. Select `swathikaanand1234-netizen/footprint-esg`.
4. Render detects `render.yaml` and deploys the unified **`footprint-esg`** web service.
5. When prompted, provide your MongoDB Atlas connection string for `MONGO_URI`.

### Or Manual Web Service Setup:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/footprint_esg?retryWrites=true&w=majority`
  - `TOKEN_SECRET`: `<any-secure-random-32-char-string>`

---

## 💻 Local Development (Without Docker)

### 1. Prerequisites
- Node.js 18+
- MongoDB on `mongodb://127.0.0.1:27017`

### 2. Backend Setup & Automated Verification
```bash
cd server
npm install
npm test      # Executes 31 unit & integration tests (auth, math, workflow, telemetry, import)
npm start     # Starts API server and Socket.IO live stream on port 5002
```
*API runs on `http://localhost:5002`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run build # Validates production build
npm run dev   # Launches Vite dev server with WebSocket proxy on port 5175
```
*Dashboard runs on `http://localhost:5175`.*

### 4. Demo RBAC Credentials
Default password for all demo accounts: `FootprintESG2026!`
- **Sustainability Manager**: `sarah.lin` (Corporate overview, approvals, period locking)
- **Plant Sustainability Coordinator**: `elena.rostova` (Data entry & submissions for Austin & Stuttgart)
- **Plant Manager**: `marcus.vance` (Monitoring for Austin Gigafactory)
- **Executive Management**: `david.chen` (Read-only corporate disclosures)
- **Third-Party Auditor**: `jennifer.auditor` (Assurance reviews & validations)
- **System Administrator**: `alex.sysadmin` (Technical admin; cannot modify ESG records per FR-004)

