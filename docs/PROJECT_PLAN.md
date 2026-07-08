# DeliveryApp — Project Plan

**Last updated:** June 3, 2026  
**Team size:** 1–3  
**Overall status:** 🟢 Phase 1–3 **complete**; Phase 4A **complete** (prod verified July 7, 2026)  
**Tracking:** [GitHub Issues](https://github.com/jereoo/DeliveryAppBackend/issues) + [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) (see `.github/SETUP_GITHUB_PROJECT.md`).  
**Latest status report:** `docs/PROJECT_LOG.md` + `docs/PROJECT_STATUS_20260603.md`  
**Architecture:** `docs/ARCHITECTURE.md` + `.cursor/rules/layered-architecture.mdc`  
**Development process:** [`docs/DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) — plan → build → test → done

---

## Vision

Full-stack delivery management: Django API on Heroku, Expo web on Vercel, React Native for devices.

**v1.0:** Single fleet — Admin, Driver, Customer only. Admin assigns deliveries (no separate Dispatcher role).  
**v2.0 (~Phase 5):** Commercial fleet — Dispatcher role, multi-tenant organizations. **Deferred.**

See `docs/ARCHITECTURE.md` for layered architecture rules and v1.0 feature gate.

---

## Architecture (v1.0)

| Layer | Backend | Frontend |
|-------|---------|----------|
| HTTP / UI | ViewSets | Components (`App.tsx`, screens) |
| Authorization | DRF Permission classes (migrate incrementally) | `userType`: admin \| driver \| customer |
| Business logic | Services (`vehicle_update.py`, `*_service.py`) | `src/services/` (`vehicleService.ts`, …) |
| Validation | Serializers | Shared helpers in services |
| Data | Models (thin) | — |

**Principles:** SSOT for CRUD, no duplicate Admin/Driver logic, SOLID, DRY, RBAC.

**Shipped example:** Vehicle update — `update_vehicle()` (backend) + `updateVehicleById()` (mobile); commits `6b74039` / `8eb2cb9`.

**Next (v1.0):** Permission classes for vehicle access; more service extractions from `App.tsx`.

**Not in v1.0:** Organization models, Dispatcher role/UI, multi-tenant querysets.

---

## Phase 1 — MVP stabilization *(complete)*

| # | Task | Status | Owner |
|---|------|--------|--------|
| 1 | Backend on Heroku (`truck-buddy`), Postgres, migrations | Done | — |
| 2 | Frontend on Vercel, API URL → Heroku | Done | — |
| 3 | CORS + env (`CORS_ORIGINS`, `EXPO_PUBLIC` / `app.config.js`) | Done | — |
| 4 | Dependencies: `googlemaps`, `usaddress`, `pycountry` | Done | — |
| 5 | Admin bootstrap (`ensure_admin`) for first login | Done | — |
| 6 | Driver registration payload (`vehicle_year`, etc.) | Done | — |
| 7 | Remove deprecated `runtime.txt`; rely on `.python-version` only | Done | `runtime.txt` removed; `.python-version` = `3.12.7` |
| 8 | Confirm Vercel Git integration → **DeliveryAppMobile** repo (not backend monorepo) | Done | Verified May 2026: `origin` → `jereoo/DeliveryAppMobile` |
| 9 | Rotate default `admin` password + document process | Done | `docs/ADMIN_BOOTSTRAP.md`; `ensure_admin` uses `ADMIN_PASSWORD` env only |
| 10 | Production smoke test checklist (login, register, CRUD) | Done | `project-docs/PRODUCTION_SMOKE_TEST.md` + `scripts/production-smoke-test.ps1` |

**Exit criteria:** All Phase 1 rows Done; no critical bugs on prod URLs.

**Post-close-out:** Run `heroku config:set ADMIN_PASSWORD=...` and `heroku run python manage.py ensure_admin -a truck-buddy` if production still accepts the old default password.

**Prod check (May 15, 2026):** API health ✅ 200 · Vercel web ✅ 200

**June 3, 2026 — Driver CRUD (Phase 1C partial):** Driver self-edit profile + vehicle ✅ prod verified. Admin vehicle update bug fixed in mobile `6b30a2c` (await Vercel retest). See `PROJECT_STATUS_20260603.md`.

---

## Phase 2 — Data & workflow reliability *(complete)*

| Item | Status |
|------|--------|
| Seed / demo data strategy for staging/production | Done — `DeliveryAppBackend/docs/SEED_DATA.md`, `seed_demo_data` command |
| Clear API validation messages for duplicate registration fields | Done |
| Logging for auth and registration failures | Done |
| Optional: staging Heroku app | Done (documented) — `DeliveryAppBackend/docs/STAGING.md`; provisioning optional |
| **Vehicle lifecycle (MVP):** soft inactive + staff reactivate; no hard delete when history exists | Done |
| Driver: deactivate own assigned vehicle (`POST /drivers/me/vehicle/deactivate/`) | Done |
| Staff: deactivate/reactivate any vehicle; hard DELETE only when zero `DriverVehicle` / `DeliveryAssignment` rows | Done |
| Driver Edit My Vehicle — capacity limits (2000 kg / 4400 lb) + kg/lb conversion | Done — prod verified June 10, 2026 (`PROJECT_STATUS_20260610.md`) |
| **Vehicle update SSOT** — shared service; Admin + Driver use `PATCH /vehicles/{id}/` | Done — prod verified June 12, 2026 (`PROJECT_STATUS_20260612.md`) |
| **Driver Edit My Vehicle — field labels** | Done — prod verified June 12, 2026 (`93d6d1a`) |
| **Layered architecture** — Cursor rules + project docs | Done — June 11–12, 2026 |

**Vehicle status — ship now vs later**

| Status | Meaning | Ship in |
|--------|---------|---------|
| **Active** | In service; eligible for assignment and deliveries | **Now** (`Vehicle.active=True`, already on model) |
| **Inactive** | Temporarily off fleet (sold, repair, driver stepped down); row kept; **staff may reactivate** | **Now** (`Vehicle.active=False`) |
| **Disposed** | Permanently retired (scrapped/totaled); never reactivated; archive or delete when no FK history | **Future** — not same as inactive; defer to Phase 4 |

**Reactivation reverification (stub only in Phase 2):** When staff sets `active=True`, API accepts today with no extra checks. Add placeholder fields/docs for future gates: insurance valid, registration valid, inspection date (see Phase 4).

---

## Phase 3 — CI/CD & release safety *(complete)*

| Item | Status |
|------|--------|
| CI: backend tests + frontend build on PR (`phase1-ci.yml`) | Done — critical suite gates CI (incl. compliance + seed); full suite runs without `continue-on-error` |
| Branch strategy: `main` = production deploys | Done |
| Document rollback (Heroku releases, Vercel deployments) | Done — `DeliveryAppBackend/docs/ROLLBACK.md` |
| Align mobile CI `EXPO_PUBLIC_BACKEND_URL` with `truck-buddy` Heroku app | Done |
| Fix `test_api.py` pytest import (manage.py test) | Done |
| Retire broken legacy workflows (`ci-cd.yml`, `cio-zero-tolerance.yml`) | Done — June 3, 2026 |
| Document CI in `docs/CI.md` (both repos) | Done |
| Mobile tests gate CI (remove `continue-on-error`) | Done |
| Verify GitHub Actions green on `main` | Done after push |

---

## Phase 4 — Product (from roadmap) *(Phase 4A complete)*

**Full Phase 4A spec:** [`docs/PHASE_4A_LEGAL_COMPLIANCE.md`](PHASE_4A_LEGAL_COMPLIANCE.md)

### Phase 4A — Driver & vehicle legal documentation *(complete — prod verified July 7, 2026)*

Commercial delivery requires **commercial insurance** (personal auto excludes delivery use), plus driver license and vehicle registration on file.

| # | Task | Status |
|---|------|--------|
| 1 | `LegalDocument` model + migrations (`DRIVER_LICENSE`, `VEHICLE_REGISTRATION`, `COMMERCIAL_INSURANCE`, `INSPECTION`) | Done — `0004_legal_document_phase_4a`, `docs/COMPLIANCE.md` |
| 2 | `compliance_service.py` — create, list, verify, reject, compliance summary | Done |
| 3 | DRF permissions + API (`/drivers/{id}/documents/`, `/vehicles/{id}/documents/`, verify/reject, `/drivers/me/compliance-status/`) | Done |
| 4 | S3 upload + download (proxy upload on web; presigned GET) | Done — `POST /documents/upload/`, `GET /documents/{id}/download/` |
| 5 | `docs/COMPLIANCE.md` — policy fields, US/CA notes, driver consent, retention | Done |
| 6 | Mobile `complianceService.ts` + PDF picker + View file | Done |
| 7 | Admin: documents on driver + vehicle (Approve/Reject, View file) | Done |
| 8 | Driver: compliance dashboard + PDF upload | Done |
| 9 | Tests + prod smoke (tom thumb license E2E) | Done — see `docs/PROJECT_LOG.md` July 7, 2026 |

**4A defaults:** No assignment blocking; no reactivate blocking; registration not blocked; inspection optional.

**4A exit criteria:** ✅ Admin approves driver docs; driver uploads PDF; compliance-status API; prod CRUD unchanged. Verified on Vercel/Heroku July 7, 2026.

### Phase 4B — Expiry + reactivation gates *(after 4A)*

| Item | Status |
|------|--------|
| Nightly job marks documents `EXPIRED` | Todo |
| `reactivate_vehicle()` checks registration + commercial insurance | Todo |
| Mobile expiry banners + admin reactivate checklist | Todo |

### Phase 4C — Dispatch assignment gate *(after 4B)*

| Item | Status |
|------|--------|
| `is_driver_eligible_for_dispatch()` in compliance service | Todo |
| Block `DeliveryAssignment` when non-compliant | Todo |
| Admin assign UI shows eligibility before save | Todo |

### Phase 4 — Other product items

- Large-item domain (dimensions, capacity matching, estimates) — see workspace `project-docs/AUTOMATED_BUILD_PLAN.md`
- Payments (Stripe), notifications, EAS / store prep
- **Vehicle `disposed` status** — third lifecycle state (distinct from inactive); staff-only

---

## Phase 5 — Commercial fleet / v2.0 *(deferred)*

**Not v1.0.** Target when moving from single-driver to commercial multi-driver operations.

| Item | Notes |
|------|--------|
| **Dispatcher** role | Assign routes/deliveries within org; not full admin |
| **Multi-tenant organizations** | `Organization`, membership, org-scoped data isolation |
| **Org-scoped RBAC** | Permission classes + queryset mixins; extend existing services |
| **Frontend** | Dispatcher screens, org context, `/api/me/` role payload |

Do not add org or dispatcher abstractions until Phase 5 begins. See `project-docs/ARCHITECTURE.md`.

---

## Production URLs (reference)

| Service | URL |
|---------|-----|
| API (Heroku) | `https://truck-buddy-f14f250ae8b3.herokuapp.com/` |
| Web (Vercel) | `https://deliveryapp-mobile.vercel.app/` |

---

## Repositories

| Repo | Role |
|------|------|
| `jereoo/DeliveryAppBackend` | Django API — `main` → Heroku `truck-buddy` |
| `jereoo/DeliveryAppMobile` | Expo app — `main` → Vercel |

Local: `C:\Users\360WEB\DeliveryAppBackend` (backend), `C:\Users\360WEB\DeliveryAppMobile` (mobile).

---

## How to track work in GitHub

1. Create a **GitHub Project** (Board): *Projects → New project → Board*.
2. Add columns: **Backlog**, **In progress**, **Done**.
3. Create **Issues** from the Phase 1 table (one issue per row, or group small items).
4. Link PRs with `Fixes #issue` in the description.

See [`.github/SETUP_GITHUB_PROJECT.md`](../.github/SETUP_GITHUB_PROJECT.md) for step-by-step clicks.

**Process:** Every item follows [`docs/DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) (DoR → implement → test → record). PRs use [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md).
