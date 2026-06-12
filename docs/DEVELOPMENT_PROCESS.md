# DeliveryApp — Development Process

**Version:** 1.0  
**Last updated:** June 12, 2026  
**Team size:** 1–3  
**Applies to:** `DeliveryAppBackend`, `DeliveryAppMobile`, workspace docs

This document defines how work moves from **plan → build → test → done → next item**. It is the process source of truth (not a Cursor rule). AI assistants and humans should follow it for feature work.

---

## 1. Process overview

Each **iteration** delivers **one backlog item** from `docs/PROJECT_PLAN.md` (or a linked GitHub Issue).

```text
Select → Specify → Implement → Verify → Record → Next
   ↑                                              |
   └──────────────────────────────────────────────┘
```

| Stage | Industry term | DeliveryApp artifact |
|-------|---------------|-------------------|
| Select | Backlog refinement | `PROJECT_PLAN.md` row or GitHub Issue |
| Specify | Definition of Ready (DoR) | Acceptance criteria in issue/PR |
| Implement | Development | Branch + PR(s) in backend and/or mobile |
| Verify | Quality gate / Definition of Done (DoD) | Tests + CI + optional prod retest |
| Record | Traceability | Update plan row, `PROJECT_STATUS_*.md` when shipped |
| Next | Iteration boundary | Pull next **Todo**; do not start without intent |

**Work in progress limit:** Prefer **one plan item at a time** per developer.

---

## 2. Sources of truth

| Document | Purpose |
|----------|---------|
| [`docs/PROJECT_PLAN.md`](PROJECT_PLAN.md) | Ordered backlog and phase status |
| [`docs/PHASE_4A_LEGAL_COMPLIANCE.md`](PHASE_4A_LEGAL_COMPLIANCE.md) | Detailed spec for active product work |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Layered architecture, v1.0 vs v2.0 scope |
| [`.cursor/rules/layered-architecture.mdc`](../.cursor/rules/layered-architecture.mdc) | Coding standards for AI/humans |
| [`docs/PROJECT_STATUS_YYYYMMDD.md`](PROJECT_STATUS_20260612.md) | Prod QA log after release |
| [`DeliveryAppBackend/docs/ROLLBACK.md`](https://github.com/jereoo/DeliveryAppBackend/blob/main/docs/ROLLBACK.md) | Rollback if deploy fails |

**v1.0 gate (before coding):** Does this need multi-tenant orgs or a Dispatcher who is not admin? If **yes** → defer to Phase 5; do not implement.

---

## 3. Definition of Ready (DoR)

Start implementation only when:

- [ ] One **specific** `PROJECT_PLAN` row or GitHub Issue is selected
- [ ] Linked spec read (e.g. Phase 4A doc) if the row references it
- [ ] **Acceptance criteria** written (3–5 checkboxes)
- [ ] Repos affected identified (backend / mobile / both)
- [ ] Scope confirmed **v1.0** (see `ARCHITECTURE.md`)

---

## 4. Definition of Done (DoD)

An item is **Done** only when **all** apply:

### Code

- [ ] Implements acceptance criteria with minimal, focused diff
- [ ] Follows layered architecture (services SSOT, thin ViewSets, mobile `src/services/`)
- [ ] No unrelated refactors or Phase 5 / multi-tenant code

### Test (quality gate)

- [ ] **Backend** (if changed): targeted tests pass **and** regression subset passes (see §6)
- [ ] **Mobile** (if changed): `npm run test:ci` passes
- [ ] **CI:** GitHub Actions green on PR (or failure documented and accepted)

### Release (when shipping to prod)

- [ ] Merged to `main` only after DoD above
- [ ] Deploy: Heroku (backend) / Vercel (mobile) — **only when explicitly requested**
- [ ] **Prod retest** for user-facing changes (admin + driver paths if applicable)
- [ ] `PROJECT_STATUS_YYYYMMDD.md` updated with test results
- [ ] `PROJECT_PLAN.md` row marked Done

### Git

- [ ] Commit only when user asks (or team policy says auto-commit on PR merge)
- [ ] No secrets in commits (`.env`, credentials)
- [ ] PR description links plan item / `Fixes #issue`

---

## 5. Iteration workflow (step by step)

### Step 1 — Select

1. Open `docs/PROJECT_PLAN.md`
2. Find the **first Todo** in the active phase (currently **Phase 4A**)
3. Open linked spec (e.g. `PHASE_4A_LEGAL_COMPLIANCE.md`)
4. Create or assign a GitHub Issue (optional but recommended)

### Step 2 — Specify

Write acceptance criteria. Example for Phase 4A #1:

```markdown
- [ ] LegalDocument model with document_type enum and status enum
- [ ] Migration applies cleanly
- [ ] Unit tests for model constraints
- [ ] No change to existing vehicle/driver CRUD behavior
```

### Step 3 — Implement

1. Branch: `feature/4a-legal-document-model` (or `fix/…` for bugs)
2. Backend first when API is needed; mobile follows API
3. One PR per repo when both change; cross-link PRs in descriptions

### Step 4 — Verify

Run tests from §6. Fix failures before marking PR ready.

For UI/API user flows: manual prod smoke on Vercel + Heroku after deploy.

### Step 5 — Record

- Mark plan row **Done** in `PROJECT_PLAN.md` (on merge or after prod verify)
- Add `PROJECT_STATUS_YYYYMMDD.md` entry if released to prod
- Close GitHub Issue

### Step 6 — Next

State the **next Todo** row. Do **not** start it in the same session unless explicitly asked (“continue” / “next item”).

---

## 6. Test commands (quality gate)

### Backend (`DeliveryAppBackend`)

```powershell
cd DeliveryAppBackend

# New feature tests (example Phase 4A)
python -m pytest tests/test_compliance.py -v --tb=short

# Regression — vehicle/driver CRUD (run when touching drivers, vehicles, auth)
python -m pytest tests/test_driver_vehicle_crud.py -v --tb=short

# Broader critical subset (matches phase1-ci.yml intent)
python manage.py test tests.test_driver_vehicle_crud tests.test_registration_validation tests.test_auth_logging --no-input
```

### Mobile (`DeliveryAppMobile`)

```powershell
cd DeliveryAppMobile
npm run test:ci
```

### Production smoke (after deploy)

- Script: `DeliveryAppBackend/scripts/production-smoke-test.ps1`
- Checklist: workspace `project-docs/PRODUCTION_SMOKE_TEST.md`
- Roles: test **admin** and **driver** when feature touches both

---

## 7. Repositories and deploy

| Repo | Remote | Production |
|------|--------|------------|
| `jereoo/DeliveryAppBackend` | `main` → Heroku `truck-buddy` | https://truck-buddy-f14f250ae8b3.herokuapp.com/ |
| `jereoo/DeliveryAppMobile` | `main` → Vercel | https://deliveryapp-mobile.vercel.app/ |

**Deploy policy:** Push to `main` triggers host deploy via GitHub integration. Do not deploy unless the team intends to ship. Rollback: `DeliveryAppBackend/docs/ROLLBACK.md`.

---

## 8. GitHub Project board (optional)

Columns: **Backlog → Ready → In progress → In review → Done**

1. One card = one `PROJECT_PLAN` row or Issue  
2. Move to **In progress** when branch is created  
3. Move to **Done** when DoD (§4) is complete  

See [`.github/SETUP_GITHUB_PROJECT.md`](../.github/SETUP_GITHUB_PROJECT.md).

---

## 9. Pull requests

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`):

- Link plan item / issue  
- Check DoR/DoD boxes  
- List test commands run and results  

Review focus: acceptance criteria, architecture, regression risk, no scope creep.

---

## 10. Using AI (Cursor) with this process

Prompt pattern:

```text
Follow docs/DEVELOPMENT_PROCESS.md.
Implement PROJECT_PLAN Phase 4A task #1.
Plan first, then build, then run tests from §6. Do not commit or deploy unless I ask.
When done, tell me the next Todo row.
```

Cursor rules (`layered-architecture.mdc`) define **how** to code; this document defines **when** each stage is complete.

---

## 11. Current focus (as of June 3, 2026)

**Phase 3:** Executed — legacy workflows removed, CI docs added, pushed and verified green.

**Phase 4A:** Backend done; mobile #6–8 done locally. **Next:** deploy backend migration + prod smoke.

**Optional:** S3 presigned upload wiring (#4); deploy backend migration to Heroku before mobile UI.

**Deferred:** Phase 5 (multi-tenant, Dispatcher) — see `.cursor/rules/v2-commercial-fleet.mdc`

---

## 12. Process change log

| Date | Change |
|------|--------|
| 2026-06-12 | Initial process v1.0 — DoR/DoD, test gates, iteration loop |
