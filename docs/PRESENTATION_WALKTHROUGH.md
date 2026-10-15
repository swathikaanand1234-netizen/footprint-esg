# FootprintESG™ — Reviewer Presentation Walkthrough & Demo Script

A step-by-step guide to delivering a polished, high-impact demonstration of **FootprintESG** to evaluators, auditors, and technical reviewers.

---

## ⚡ 1. The 30-Second Elevator Pitch

> *"FootprintESG is an enterprise-grade Environmental Sustainability & ESG Performance Management platform. It replaces messy, fragmented spreadsheets across global manufacturing plants with a single, verifiable system of record. Aligned with the **GHG Protocol Corporate Standard** and **ISO 14064-3**, it tracks Scope 1 direct combustion, Scope 2 purchased electricity, live substation meters, four-eyes audit workflows, and 2030 Net-Zero trajectories."*

---

## 🚀 2. Launching the Demo (On Any Laptop)

### Option A: One-Command Docker Launch (Recommended)
```bash
docker compose up --build
```
- **Frontend Portal**: [http://localhost:3002](http://localhost:3002)
- **Backend API**: [http://localhost:5002/api/overview](http://localhost:5002/api/overview)
- **MongoDB**: Runs automatically on port `27019` with zero manual database setup (auto-seeds 4 global plants, 6 RBAC roles, historical utility logs, and ISO audit statements).

### Option B: Local Node.js Development
```bash
# Terminal 1: Backend
cd server && npm install && npm start

# Terminal 2: Frontend
cd client && npm install && npm run dev
```
- Open [http://localhost:5175](http://localhost:5175).

---

## 🎭 3. Demo Credentials (One-Click Login Available)

| Persona | Username | Password | Role & Scope |
| :--- | :--- | :--- | :--- |
| **Dr. Sarah Lin** | `sarah.lin` | `FootprintESG2026!` | **Sustainability Lead** (Corporate VP, all 4 global plants, approvals & locking) |
| **Elena Rostova** | `elena.rostova` | `FootprintESG2026!` | **Plant Coordinator** (Austin & Stuttgart data entry & submissions) |
| **Marcus Vance** | `marcus.vance` | `FootprintESG2026!` | **Plant Director** (Austin Gigafactory monitoring only) |
| **Jennifer Vance** | `jennifer.auditor` | `FootprintESG2026!` | **Third-Party Auditor** (Bureau Veritas ISO 14064 verifier) |

---

## ⏱️ 4. The 5-Minute Reviewer Presentation Script

### Step 1: Login & Role-Based Access Control (30s)
1. Open the portal. Point out the **Quick-Login Role Selector** at the bottom of the card.
2. Sign in as **Dr. Sarah Lin** (`sarah.lin`).
3. **What to say**:
   > *"Notice the clean enterprise design. In the bottom-left sidebar, our user card shows Dr. Sarah Lin with global multi-facility scope and active session status. The platform enforces strict Four-Eyes principles: operational plant coordinators enter data, but only authorized sustainability leads or auditors can approve records into official corporate disclosures."*

---

### Step 2: Factory Overview & Executive KPIs (45s)
1. Stay on **Factory Overview** (`/`).
2. Highlight the 4 core metric cards:
   - **Total Plant Emissions**: Metric tons $CO_2e$ split between Direct Fuels (Scope 1) and Grid Power (Scope 2).
   - **Emissions per Ton Produced**: Operational carbon intensity ($tCO_2e / ton$).
   - **Clean Energy Share**: Grid vs. on-site renewable power.
   - **Waste Kept from Landfills**: Diversion percentage.
3. Show the **2030 Company Emission Reduction Target** progress bar and the plant summary league table.
4. **What to say**:
   > *"Every single KPI here adheres to the GHG Protocol. Notice the 'APPROVED ONLY' badge—unreviewed manual drafts or rogue data are strictly excluded from corporate accounting until officially verified."*

---

### Step 3: Live Substation Utility Meters (1m)
1. Click **Live Utility Meters** in the sidebar.
2. Observe the numbers breathing smoothly in real time:
   - **Electricity Grid Load** ($kW$)
   - **Solar PV Generation** ($kW$)
   - **Boiler Natural Gas Flow** ($MMBtu/hr$)
   - **Water Intake Rate** ($m^3/hr$)
3. Switch between facilities using the dropdown (**Austin**, **Stuttgart**, **Yokohama**, **Monterrey**).
4. Click **Simulate 10s Telemetry Pulse**.
5. **What to say**:
   > *"Here we have real-time substation monitoring over Socket.IO. Unlike naive random number generators that jump erratically, our simulation engine uses continuous adjacent drift—bounded Brownian walk with physical limits—giving the visual experience of calibrated factory flow meters."*

---

### Step 4: Data Entry, CSV Batch Import & Four-Eyes Approvals (1m 30s)
1. Click **Review & Approvals** in the sidebar.
2. Click **Enter Monthly Data** in the top navigation bar.
3. Show the modal:
   - Tab 1: **Single Facility Form** (direct manual entry with auto-calculated intensity).
   - Tab 2: **CSV Batch Import** (demonstrates bulk upload).
4. In the CSV tab, click **Validate & Import Batch**. Show the success confirmation.
5. Close the modal and show the newly imported records in the **Review Queue**.
6. Switch between:
   - **Facility Records Queue**: Approve or reject pending records.
   - **Mutation Audit Trail**: Tamper-proof log of every mutation (actor, timestamp, delta).
   - **Assurance Certifications**: Independent third-party audit statements from Bureau Veritas and DNV GL.
7. **What to say**:
   > *"This satisfies regulatory compliance PR-09 and PR-13. All data mutations record the exact actor, timestamp, and changes. System administrators are strictly prohibited from modifying environmental numbers, preventing internal IT conflicts of interest."*

---

### Step 5: Official Sustainability Report & Printing (45s)
1. Click **Annual ESG Report** in the sidebar.
2. Show the complete corporate scorecard covering Scope 1, Scope 2, Total GHG, Carbon Intensity, Clean Energy, Water Withdrawal Volume, Water Recycle Rate, and Zero-Waste Diversion.
3. Click **Download CSV Report** (instantly downloads a formatted corporate assertion CSV).
4. Click **Print Scorecard** (or press `Ctrl+P`).
5. **Show the print preview**:
   - The navigation sidebar is completely hidden.
   - The top header bar and buttons are stripped away.
   - The scorecard formats cleanly into standard portrait paper layout with zero ink waste.
6. **What to say**:
   > *"Finally, corporate disclosures need to be exported and presented to boards and external verifiers. The scorecard includes full water and waste accounting, exports cleanly to CSV, and has dedicated print stylesheets that automatically hide UI navigation for one-click PDF generation."*

---

## 💡 5. Anticipated Technical Questions & Answers

| Reviewer Question | Winning Answer |
| :--- | :--- |
| **"How does the app prevent unverified data from corrupting disclosures?"** | *"By architecture. The `/overview` and `/reports/export` aggregators explicitly filter for `status: { $in: ['APPROVED', 'AUDIT_LOCKED'] }`. Drafts and unapproved submissions remain sequestered in the review queue."* |
| **"What happens if production output is 0? Does division by zero crash the KPIs?"** | *"Our calculation engine (`calculationService.js`) enforces zero-denominator boundary guards, gracefully marking intensity as unavailable rather than outputting `NaN` or `Infinity`."* |
| **"How is WebSocket streaming handled in production Docker?"** | *"Our Nginx reverse proxy configuration (`client/nginx.conf`) includes HTTP/1.1 WebSocket upgrade headers for `/socket.io/`, ensuring bidirectional push events without polling fallback."* |
| **"Is the audit trail tamper-proof?"** | *"Yes. Every transition (Draft $\rightarrow$ Submitted $\rightarrow$ Approved $\rightarrow$ Audit Locked) creates an immutable `AuditLog` entry recording the authenticated user, role, facility, and mutation details."* |
