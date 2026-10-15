# FootprintESG — Product Requirements Document

## Product summary and problem
FootprintESG is a MERN web application for centralized environmental sustainability data management: energy, water, waste, production and Scope 1/2 emissions. Environmental data may be fragmented across meters, plant systems, bills and spreadsheets; manual consolidation creates delay/error risk and limits visibility, data quality and traceability.

## Goals
1. Centralize environmental operational records.
2. Display latest valid plant readings with truthful freshness indicators.
3. Preserve history for trends and reporting.
4. Make KPI/emissions calculations reproducible and explainable.
5. Control manual records through review/approval.
6. Enforce organization/facility boundaries and retain audit history.
7. Support targets, facility comparison and basic exports.

## Roles
- Sustainability Manager: authorized organization-level operations and review.
- Plant Sustainability Coordinator: enter/import and submit data for assigned facilities.
- Plant Manager: monitoring/analytics for assigned facilities.
- Executive Management: read-only organization summaries.
- Auditor/Reviewer: explicitly authorized review/audit access.
- System Administrator: technical operations; no automatic sustainability-record edit privilege.

## MVP scope
Authentication/RBAC; organization/facility scope; source health; simulated automated ingestion; live plant/organization dashboards; historical trends; energy/water/waste/production; Scope 1/2 emissions; KPIs/targets; facility comparison; manual entry; CSV/XLSX import; approvals; audit; basic report export; tests, seed data and setup docs.

## Out of scope
Physical IoT deployment, SCADA, ERP, Scope 3, supplier ESG, Social/Governance modules, predictive AI/ML, mobile app, automated regulatory submission, carbon-credit marketplace and certification/compliance claims.

## Core journeys
**Live:** sign in → choose authorized facility → view latest accepted readings/timestamps → receive authorized updates without refresh → see delayed/stale/absent data explicitly.

**Manual:** create draft → validate → submit → authorized reviewer approves/rejects → only approved records become official reporting inputs → preserve audit events.

**Import:** upload supported file → validate type/size/columns/rows → show row-level errors → commit according to an explicitly defined all-or-nothing or partial policy → record outcome and actor. Never silently commit an unknown subset.

**KPI/emissions:** choose authorized scope and period → aggregate eligible records → apply documented formulas/units → use applicable versioned factors → show unavailable states for missing inputs, factors or zero denominators.

**Report/audit:** choose authorized period/scope → generate from eligible data → include units, methodology/context and caveats → surface export failures honestly → inspect authorized audit history.

## Acceptance requirements
- **PR-01 Authentication:** protected APIs/pages require a valid identity.
- **PR-02 Authorization:** every protected operation enforces role/resource scope server-side; changing an ID cannot access another tenant.
- **PR-03 Live state:** latest accepted reading and source timestamp are shown; invalid data cannot replace current state.
- **PR-04 Freshness:** LIVE <5 min, DELAYED 5–15 min, STALE >15 min; boundaries are consistently defined and tested.
- **PR-05 History:** authorized time-bounded queries support metric/facility filtering and pagination.
- **PR-06 Domain records:** required fields, units, facility ownership and timestamps are validated.
- **PR-07 Approval:** draft → submitted → approved/rejected; invalid transitions and unauthorized decisions fail.
- **PR-08 Official data:** unapproved manual records are excluded from official reporting.
- **PR-09 Import:** corrupt/unsupported files and invalid rows produce useful feedback and cannot silently corrupt records.
- **PR-10 Emissions:** activity × applicable factor; retain factor provenance/version.
- **PR-11 KPI:** documented formulas/unit rules; missing/zero denominators do not create misleading numbers.
- **PR-12 Targets/comparison:** periods, units, methodology and KPI direction are consistent or differences disclosed.
- **PR-13 Audit:** significant mutations, approvals and configuration changes record actor/time/action/entity.
- **PR-14 Reports:** permissions and approval eligibility are respected; export status is truthful.
- **PR-15 UX:** relevant loading, empty, error, partial, stale and unauthorized states exist.
- **PR-16 Demo:** synthetic data is labelled and never represented as real telemetry.
- **PR-17 Accessibility:** core workflows support keyboard use, labels, visible focus and actionable errors.
- **PR-18 Reproducibility:** setup/build/test instructions match the actual repository.

## KPI catalogue
Total energy = sum normalized energy; energy intensity = energy / production output; renewable % = renewable / total × 100; water intensity = consumption / production output; water reuse % = reused / withdrawal × 100; recycling rate = recycled / total waste × 100; diversion rate = diverted from landfill / total waste × 100; waste intensity = waste / production output; Scope 1/2 emissions = activity × applicable factor; total emissions = Scope 1 + Scope 2; emission intensity = total CO2e / production output.

The implementation must define compatible units, conversions, period aggregation and factor methodology. This PRD does not prescribe actual emission-factor values.

## Data integrity and success criteria
Current snapshot and historical measurements are different workloads. Invalid automated measurements must not update official current state. Duplicate/out-of-order readings need deterministic behavior. Approved records cannot be silently overwritten. Absence is not zero. Stale sources remain visible as stale. Success means journeys have passing tests, authorization boundaries are tested, formulas have normal/boundary/missing/zero tests, factor provenance is preserved, clean setup is reproducible, no unresolved critical/high security issue remains, and limitations are honestly documented.

## Open questions
Resolve from repository or explicit decision: auth/session design, units/conversions, import transaction policy, timezone/reporting periods, factor source/dataset, export formats, actual API routes and existing test commands. Do not guess.
