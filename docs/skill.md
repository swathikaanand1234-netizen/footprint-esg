# FootprintESG Coding-Agent Skill

## Mandatory workflow
1. **Inspect:** read root `AGENTS.md`, `project.md`, `prd.md`, `srs.md`, manifests/lockfiles, README, env examples, routes, models, auth, sockets, tests and deployment config. Check git status and map real entry points/data flow.
2. **Baseline:** run relevant existing checks when feasible; record actual output. Do not infer success.
3. **Trace:** connect the task to requirement IDs, acceptance criteria, affected paths, data-integrity risks, permissions and tests.
4. **Resolve uncertainty:** inspect evidence first. If still unknown, mark `OPEN QUESTION`; never invent routes, schemas, dependencies, factor values or integrations.
5. **Ponytail ladder:** need? existing solution? standard library? native feature? installed dependency? simple one-liner? Otherwise minimum complete implementation plus focused test.
6. **Implement:** smallest coherent diff; validate untrusted inputs server-side; enforce auth/resource scope; preserve contracts; persist before socket emit; handle error/empty/loading/stale states; retain provenance and audit.
7. **Test:** changed branches, loops, parsers, calculations, transitions and security decisions need focused tests, including edge cases.
8. **Review:** inspect the full diff and surrounding flow for regressions, races, tenant leaks, data loss, missing tests, excess dependencies, accessibility and inaccurate docs.
9. **Verify:** run relevant existing test/lint/typecheck/build commands. Report skipped checks and why.
10. **Report:** implementation + requirement IDs; exact files; commands/results; tests; skipped checks; risks/open questions; next step.

## Never
Do not remove security, validation, error handling, data-loss protection, accessibility or tests to reduce LOC. Do not add speculative abstractions, dependencies, microservices, brokers, caches or ML services. Do not claim features/checks/deployment/compliance without evidence. UI hiding is not authorization. Missing is not zero. Do not broadcast before persistence or trust arbitrary socket rooms. Never silently overwrite approved records. Label synthetic data. Never invent emission factors or claim certification.

## Project invariants
- MERN modular monolith; REST/JSON + Socket.IO.
- Live current snapshot differs from historical records.
- Invalid automated readings never update official current state.
- Freshness: LIVE <5m, DELAYED 5–15m, STALE >15m; define/test boundaries.
- Manual workflow: draft → submitted → approved/rejected; only approved data is official.
- Emissions = activity × applicable factor; preserve factor version/provenance.
- MVP scope is Scope 1 and Scope 2; intensity denominators use production output.
- SDG 6/7/12/13 mapping is descriptive, not a formula modifier.
- AI/ML prediction, Scope 3, physical IoT, SCADA, ERP, mobile and automated regulatory submission are out of MVP.

## Definition of done
Acceptance criteria met; server validation and permissions intact; risky logic tested; relevant checks run or explicitly skipped; docs match observed behavior; final report is evidence-based and names remaining risks.
