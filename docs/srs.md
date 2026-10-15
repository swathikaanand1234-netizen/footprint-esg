# FootprintESG — Software Requirements Specification

## 1. Purpose and context
This SRS defines observable MVP behavior. Requirement IDs must map to code and tests. `TBD` means evidence or a decision is needed. System: React client; Node.js/Express modular monolith; MongoDB; Socket.IO for authorized live updates; REST/JSON for ordinary operations; configured or simulated data adapters. Add jobs only when needed. No microservices or ML service for MVP.

Flows: automated source → ingestion → validation → historical measurement/current snapshot → authorized socket event → dashboard; historical records + approved manual records → aggregation → KPI/emission engine → trends/targets/comparisons/reports; manual entry/import → draft → submitted → review → approved/rejected.

## 2. Functional requirements
### Identity and scope
- **FR-001** Authenticate users before protected access.
- **FR-002** Enforce role and resource scope on every protected server operation.
- **FR-003** Scope queries and socket subscriptions to authorized organization/facility.
- **FR-004** Technical-admin role alone does not grant sustainability-record edit privilege.
- **FR-005** Return safe errors without secrets or stack traces.
- **FR-006** Associate facilities and records with an organization.
- **FR-007** Restrict facility-scoped users to assigned facilities.
- **FR-008** Validate permissions and references for user/facility administration.

### Ingestion and live data
- **FR-009** Accept automated readings only from configured/authorized sources.
- **FR-010** Validate source, organization, facility, metric, numeric value, unit, timestamp and quality.
- **FR-011** Invalid readings must not update official current state.
- **FR-012** Persist accepted readings historically and update current state deterministically.
- **FR-013** Handle duplicate/out-of-order messages deterministically.
- **FR-014** Expose source last-seen and freshness status.
- **FR-015** Show LIVE/DELAYED/STALE according to documented thresholds.
- **FR-016** Emit only data each socket recipient may access.
- **FR-017** Socket failure must not erase persisted history.

### Records and history
- **FR-018** Support energy, water, waste and production records with validated units/timestamps.
- **FR-019** Support authorized scope and bounded time ranges.
- **FR-020** Enforce pagination or reasonable result limits.
- **FR-021** Distinguish missing data from zero.
- **FR-022** Exclude draft/submitted manual records from official reporting.

### Entry, import and approval
- **FR-023** Permit authorized users to create/edit drafts within scope.
- **FR-024** Validate required fields and domain rules before submission.
- **FR-025** Put submitted records into explicit review state.
- **FR-026** Only authorized reviewers can approve/reject.
- **FR-027** Preserve rejected records and decision/reason as required.
- **FR-028** Reject invalid transitions and handle concurrent decisions safely.
- **FR-029** Approved records cannot be silently overwritten; corrections remain traceable.
- **FR-030** Validate import file type, size, columns, rows and parser resource limits.
- **FR-031** Identify row-level import errors and state commit semantics.
- **FR-032** Audit imports and approval actions.

### KPI, targets and emissions
- **FR-033** Calculate KPIs using documented formulas and normalized units.
- **FR-034** Handle missing values/zero denominators without misleading results.
- **FR-035** Store KPI unit/formula version and favorable direction where applicable.
- **FR-036** Calculate emissions as activity data × applicable factor.
- **FR-037** Retain factor identity/version, units, provenance and period.
- **FR-038** Respect factor effective dates and activity/region metadata when available.
- **FR-039** Calculate target progress with consistent scope, period, units and KPI direction.
- **FR-040** Compare facilities using comparable periods/methodology or disclose differences.

### Reports and audit
- **FR-041** Include only authorized and eligible records in reports.
- **FR-042** Include period, units, calculation context and relevant caveats.
- **FR-043** Surface export failure as failure.
- **FR-044** Audit significant data, approval and configuration changes.
- **FR-045** Include actor, timestamp, action, entity reference and safe metadata.
- **FR-046** Prevent ordinary users from silently altering/deleting audit history.
- **FR-047** SDG mapping is descriptive and does not change calculations.

### UI and operations
- **FR-048** Show loading, empty, error, partial and stale states as applicable.
- **FR-049** Provide field-level feedback and preserve input safely after recoverable errors.
- **FR-050** Label synthetic/demo data.
- **FR-051** Document setup, env vars, scripts, tests and deployment from actual evidence.

## 3. Non-functional requirements
- **NFR-001 Security:** validate trust-boundary inputs; least privilege; safe errors.
- **NFR-002 Tenant isolation:** test cross-organization/facility denial for REST and sockets.
- **NFR-003 Integrity:** preserve approved records, current-state correctness and calculation provenance.
- **NFR-004 Reliability:** socket disconnection is not data loss.
- **NFR-005 Performance:** bound queries, ranges, payloads and imports; set numeric targets only after workload is known.
- **NFR-006 Maintainability:** modular monolith, clear boundaries, minimal dependencies.
- **NFR-007 Testability:** calculations/validation/transitions testable without external systems.
- **NFR-008 Observability:** actionable logs without secrets or unnecessary sensitive data.
- **NFR-009 Accessibility:** keyboard operation, labels, visible focus and useful errors.
- **NFR-010 Compatibility:** versions supported must be confirmed by project config.
- **NFR-011 Configuration:** validate required env vars at startup.
- **NFR-012 Privacy:** minimize and protect personal/organizational data.
- **NFR-013 Reproducibility:** verify documented clean setup and tests.
- **NFR-014 Auditability:** important changes/calculations retain provenance.
- **NFR-015 Degradation:** missing/stale sources and export failures are visible.
- **NFR-016 Dependency discipline:** prefer existing dependencies, standard library and native features.
- **NFR-017 Error handling:** do not swallow errors; distinguish validation from unexpected failures.
- **NFR-018 Honest delivery:** report checks run, skipped checks and risks.

## 4. Logical data model
Possible entities (reconcile with actual schemas before changing code): organizations, facilities, users/roles/permissions, data_sources, measurements, current_measurements, energy_records, water_records, waste_records, production_records, emission_factors, emissions, kpis, targets, reporting_periods, imports, approvals, audit_logs.

Suggested measurement attributes: organizationId, facilityId, sourceId, metric, value, unit, timestamp, quality, createdAt. Suggested current snapshot: organizationId, facilityId, sourceId, metric, value, unit, timestamp, status, lastSeenAt, updatedAt. These are logical suggestions, not a mandate to duplicate existing models. Use consistent date handling and document timezone assumptions. Add indexes based on observed queries. Confirm MongoDB version before special time-series features. Do not claim a retention policy/collection exists until verified.

## 5. API requirements
Intended base path is `/api/v1` unless an existing established base should be preserved. Inventory actual routes first. Logical groups: auth, organizations/facilities/users, sources/health, measurements, domain records, factors/emissions, KPIs/targets, imports/approvals, dashboards/comparison, reports/exports, audit. Validate inputs, authorize before accessing scoped data, derive/verify ownership from trusted identity, bound queries and use safe errors. Document a route only after implementation and test. Do not add idempotency infrastructure without demonstrated need.

## 6. Socket.IO requirements
Authenticate connections; authorize room membership/subscriptions; derive room scope server-side; centralize payload contracts; persist valid data before emitting; never broadcast secrets/internal documents; recover after reconnect via durable API/current state; test cross-tenant leakage, duplicates, stale data and invalid messages. Actual event names must be discovered in code, not invented in docs.

## 7. Security checklist
Use vetted password hashing if password auth exists. Base token/session policy on actual implementation and threat model. Protect auth/expensive routes against abuse where justified. Restrict uploads/parser resources; never trust client MIME alone. Prevent injection, path traversal, CSV formula injection, mass assignment and unsafe object updates. Use least-privilege database credentials. Keep secrets and sensitive payloads out of logs.

## 8. Calculation and edge cases
Test valid/zero/invalid values; missing and zero denominators; missing factor; factor effective-date boundaries; incompatible units; empty period; missing/zero previous period; duplicate/out-of-order readings; stale sources; malformed import rows; partial import semantics; unauthorized transitions; concurrent approval attempts. No numeric emission expectation is valid without activity units, factor value/units and methodology.

## 9. Verification and release
Unit tests: formulas, unit conversion, validators, freshness, transitions, factor selection. Integration: database, auth/scope, import, approval and reporting eligibility. Socket: auth, room isolation, payloads, reconnect/order. UI/E2E: login, dashboard, entry, review, import, KPIs/targets and export. Security: IDOR/tenant isolation, mass assignment, upload limits, malformed input, auth abuse. Use existing configured commands and never claim a test passed unless run.

Maintain traceability: requirement ID, code location, test ID, observed result, notes. Release only when MVP requirements have evidence and relevant tests pass or exceptions are explicit. No unresolved critical/high security issue; no invalid-data path mutates official current state; approved records and factor use remain traceable; setup is reproducible; limitations are disclosed.
