# FootprintESG — Project Implementation Blueprint

## Mission
Centralize energy, water, waste, production, and Scope 1/2 emissions data. Provide near-real-time plant monitoring, historical analysis, KPI/target tracking, facility comparison, controlled manual entry/import, approvals, audit history and basic reporting.

## Architecture and roles
- React frontend; Node.js + Express backend; MongoDB; REST/JSON for normal operations; Socket.IO for authorized live updates.
- Use a modular monolith, not microservices. Inspect the repository's actual versions and conventions before choosing implementation details.
- Simulated automated sources are acceptable for the academic demo. No separate ML service is needed for MVP.
- Roles: Sustainability Manager (organization operations/review); Plant Sustainability Coordinator (drafts/submissions for assigned facilities); Plant Manager (assigned-facility monitoring); Executive Management (read-only organization summaries); Auditor/Reviewer (authorized review/audit); System Administrator (technical administration, not automatic sustainability-data edit privilege).
- Enforce authorization on the server. UI hiding is not access control.

## Distinct data flows
**Live:** source → ingestion → validation → historical measurement + current snapshot → Socket.IO → dashboard. Invalid readings never update current state; persist before broadcasting. Show source timestamp and freshness.
**Historical:** persisted measurements + approved records → aggregation → KPI/emission calculations → trends, targets, comparisons and reports. Missing is not zero; label simulated, stale, partial and unapproved data.
**Manual:** entry/import → draft → submitted → approved/rejected. Draft/submitted data is not official. Approval and significant changes are auditable. Approved records cannot be silently overwritten.

Freshness convention: LIVE <5 minutes; DELAYED 5–15 minutes; STALE >15 minutes. Specify and test exact boundary semantics.

## MVP checklist
- [ ] Authentication, server-side RBAC and tenant/facility isolation
- [ ] Organization/facility/user management as appropriate
- [ ] Source configuration, health and freshness
- [ ] Validated simulated/automated measurements
- [ ] Live plant/organization dashboards and historical trends
- [ ] Energy, water, waste and production records
- [ ] Scope 1/2 emissions with factor provenance/version
- [ ] KPIs, targets and facility comparison
- [ ] Manual entry, CSV/XLSX import and approval workflow
- [ ] Audit trail and basic report/export
- [ ] Loading, empty, error, unauthorized, partial and stale UI states
- [ ] Tests, demo data, setup and deployment documentation

## Calculation rules
- Total energy = sum normalized energy; energy intensity = energy / production output; renewable % = renewable / total × 100.
- Water intensity = water consumption / production output; reuse % = reused / withdrawal × 100.
- Recycling rate = recycled waste / total waste × 100; diversion rate = diverted-from-landfill waste / total waste × 100; waste intensity = waste / production output.
- Emissions = activity data × applicable factor; total emissions = Scope 1 + Scope 2; emission intensity = total CO2e / production output.
- Trend % = (current − previous) / previous × 100. Missing/zero previous values require an explicit unavailable state.
- Preserve units, factor source/version/effective dates and calculation context. Never invent factor values; demo values must be labelled synthetic. KPI direction (`LOWER_IS_BETTER`/`HIGHER_IS_BETTER`) determines favorability.

## Implementation sequence
1. Audit actual repo, scripts, routes, schemas, tests and failures; record baseline and prioritized gaps.
2. Fix only missing foundations: environment validation, startup, auth, authorization, error handling and logging.
3. Establish data integrity: unit rules, ingestion validation, current/history separation, approval transitions, factor versioning and audit.
4. Complete vertical workflows: entry/import/review, KPIs/emissions, targets, comparisons, reports and dashboards.
5. Verify socket auth/rooms, persistence-before-emit, reconnect, duplicate/out-of-order and stale behavior.
6. Review security, accessibility, failure states and unnecessary dependencies.
7. Verify clean setup/build/tests and report residual risks honestly.

Do not broad-rewrite before baseline audit. Work in small tested slices. Definition of done: acceptance criteria pass; server permissions and validation remain; risky logic has tests; approved data is traceable; UI handles failure states and keyboard access; relevant checks actually pass; docs match behavior; skipped checks and risks are disclosed.

## Out of MVP
Physical IoT installation, SCADA, ERP, Scope 3, supplier ESG, Social/Governance modules, predictive AI/ML, mobile app, automated regulatory submissions and carbon-credit marketplace.
