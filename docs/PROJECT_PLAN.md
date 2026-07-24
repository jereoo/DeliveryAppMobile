# DeliveryApp — Project Plan

**Last updated:** July 23, 2026  
**Team size:** 1–3  
**Overall status:** 🟢 Phase 1–4C **complete**; Phase 4D **in progress** (backend admin API shipped; mobile inbox + email Todo)  
**Current focus:** Phase 4D compliance ops UX (admin inbox UI, expiry reminders). Phase 4G (staff RBAC) **backlog**.  
**Requirements review:** [`docs/COMPLIANCE_REQUIREMENTS_REVIEW.md`](COMPLIANCE_REQUIREMENTS_REVIEW.md) (BC local delivery / pickup truck MVP)  
**Tracking:** [GitHub Issues](https://github.com/jereoo/DeliveryAppBackend/issues) + [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) (see `.github/SETUP_GITHUB_PROJECT.md`).  
**Latest status report:** `docs/PROJECT_LOG.md` + `docs/PROJECT_STATUS_20260603.md`  
**Architecture:** `docs/ARCHITECTURE.md` + `.cursor/rules/layered-architecture.mdc`  
**Development process:** [`docs/DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) — plan → build → test → done

---

## Vision

Full-stack delivery management: Django API on Heroku, Expo web on Vercel, React Native for devices.

**v1.0:** Single **local delivery** fleet (pickup trucks / vans optional) — Admin, **Staff** (role-based), Driver, Customer. Admin assigns deliveries; admin manages staff accounts and permissions.  
**v1.0 geography:** US/CA capable; **primary ops context BC** (Class 5, ICBC) per compliance requirements review.  
**v2.0 (~Phase 5):** Courier **fleet / logistics** — Dispatcher role, multi-tenant organizations. **Deferred — not MVP.**

See `docs/ARCHITECTURE.md` for layered architecture rules and v1.0 feature gate.

---

## Architecture (v1.0)

| Layer | Backend | Frontend |
|-------|---------|----------|
| HTTP / UI | ViewSets | Components (`App.tsx`, screens) |
| Authorization | DRF Permission classes (migrate incrementally) | `userType`: admin \| staff \| driver \| customer (+ explicit role/permissions from API) |
| Business logic | Services (`vehicle_update.py`, `*_service.py`) | `src/services/` (`vehicleService.ts`, …) |
| Validation | Serializers | Shared helpers in services |
| Data | Models (thin) | — |

**Principles:** SSOT for CRUD, no duplicate Admin/Driver logic, SOLID, DRY, RBAC.

**Shipped example:** Vehicle update — `update_vehicle()` (backend) + `updateVehicleById()` (mobile); commits `6b74039` / `8eb2cb9`.

**Next (v1.0):** Permission classes for vehicle access; more service extractions from `App.tsx`.

**Not in v1.0 (today):** Organization models, Dispatcher role/UI, multi-tenant querysets.  
**Planned v1.0+ (Phase 4G):** Staff registration/login and admin-managed roles/permissions (see below).

---

## Staff accounts & RBAC — requirements *(Phase 4G — backlog)*

**Problem today:** Admin access relies on `ensure_admin` bootstrap and a login heuristic (customer → driver → staff). There is no staff onboarding flow, no staff-specific registration, and no UI to manage staff roles or fine-grained permissions.

**Goal:** Let the business owner add operational staff (dispatch, compliance review, read-only reporting) without sharing the superuser password, with auditable role assignments.

### Staff registration

| # | Requirement | Status | Priority |
|---|-------------|--------|----------|
| 1 | **No public staff self-registration** — staff accounts are created by an existing admin (or invite flow), not via the driver/customer register screens | Todo | High |
| 2 | Admin API + UI to **create staff user** (username, email, password, first_name, last_name) | Todo | High |
| 3 | Optional **invite-by-email** flow: admin sends invite link/token; staff sets password on first login | Todo | Medium |
| 4 | Staff creation sets `is_staff=True`; **never** auto-grant `is_superuser` unless Super Admin role selected | Todo | High |
| 5 | Deactivate staff (`is_active=False`) without deleting audit history | Todo | High |
| 6 | Staff profile fields: phone (optional), job title (optional) | Todo | Low |

### Staff login

| # | Requirement | Status | Priority |
|---|-------------|--------|----------|
| 1 | Staff use the same JWT login (`POST /api/token/`) as other users | Todo | High |
| 2 | Replace client-side role **guesswork** with explicit **`GET /api/me/`** (or `/api/staff/me/`) returning `role`, `permissions`, and allowed screens | Todo | High |
| 3 | Mobile/web **Staff dashboard** route — menu items filtered by permissions (not full admin menu for every staff user) | Todo | High |
| 4 | Block staff login to driver/customer-only flows when user has no linked driver/customer profile | Todo | Medium |
| 5 | Password reset / change-password flow for staff (reuse Django auth or API endpoint) | Todo | Medium |

### Admin — manage staff permissions & roles

| # | Requirement | Status | Priority |
|---|-------------|--------|----------|
| 1 | Admin UI: **list all staff** (active + inactive), search by name/email | Todo | High |
| 2 | Admin UI: **edit staff role** and save; API `PATCH /api/staff/{id}/` or equivalent | Todo | High |
| 3 | **v1.0 role set** (minimum): `Super Admin`, `Operations Admin`, `Compliance Reviewer`, `Read Only` | Todo | High |
| 4 | **Permission matrix** enforced on backend (DRF permission classes), not UI-only hiding | Todo | High |
| 5 | Map roles → permissions (examples): approve/reject drivers; verify/reject compliance docs; assign deliveries; CRUD vehicles/drivers/customers; manage staff users | Todo | High |
| 6 | Only **Super Admin** may create/edit/deactivate other staff or change roles | Todo | High |
| 7 | Compliance Reviewer: verify/reject documents **without** delivery assignment or staff management | Todo | Medium |
| 8 | Read Only: view drivers, vehicles, deliveries, compliance status — **no writes** | Todo | Medium |
| 9 | Audit log: who changed a staff user’s role and when (append-only admin event log) | Todo | Medium |

**Suggested permission areas (backend constants):**

| Area | Super Admin | Operations Admin | Compliance Reviewer | Read Only |
|------|:-----------:|:------------------:|:-------------------:|:---------:|
| Manage staff users & roles | ✓ | — | — | — |
| Approve/reject driver registration | ✓ | ✓ | — | view |
| Verify/reject compliance documents | ✓ | ✓ | ✓ | view |
| Assign deliveries / dispatch | ✓ | ✓ | — | view |
| CRUD drivers, vehicles, customers | ✓ | ✓ | — | view |
| Reactivate vehicles | ✓ | ✓ | — | view |
| View reports / compliance inbox | ✓ | ✓ | ✓ | ✓ |

### Technical approach (when implemented)

| Layer | Direction |
|-------|-----------|
| Backend | Django `Group` + custom permissions **or** `StaffRole` model with JSON permission flags; extend existing DRF permission classes |
| API | `StaffUserViewSet` (admin-only), `GET /api/me/` with role payload, staff create/deactivate endpoints |
| Mobile | `staffService.ts`, Staff admin screens in `App.tsx` (or extracted screens), permission-gated navigation |
| Migration | Backfill existing bootstrap admin as `Super Admin`; no change to driver/customer registration paths |

### Phase 4G exit criteria

- Admin can create a staff user, assign a role, and that user can log in and see only permitted menus.
- Non–Super Admin cannot create staff or elevate privileges.
- Driver/customer registration and login unchanged.
- Tests cover role enforcement on at least: compliance verify, delivery assign, staff CRUD.

**Not in Phase 4G:** Multi-tenant org staff (Phase 5), Dispatcher role (Phase 5), SSO/SAML.

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
| Seed / demo data strategy for staging/production | Done — `SEED_DATA.md`, `seed_demo_data`, `seed_driver_vehicle_test_data` (Heroku QA accounts) |
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
| 10 | **Production upload formats:** driver submits **PDF file** or **photo/scan** of licence, registration, insurance (camera/gallery on mobile; PDF picker on web) | Todo — enforce/validate accepted MIME types in UI + API; no arbitrary file types |
| 11 | **QA test PDFs:** fictional SAMPLE documents via backend `python manage.py generate_compliance_test_pdfs` → `DeliveryAppBackend/tests/fixtures/compliance/` | Done — use PDFs for upload/E2E testing (not photos in CI) |

**Driver document upload (v1.0):** Real drivers upload a **PDF** or take a **photo/scan** of their documents. Development and automated tests use the **PDF generator** (`generate_compliance_test_pdfs`) — clearly labeled SAMPLE / TEST ONLY fixtures, not government-form replicas.

**4A defaults:** No assignment blocking; no reactivate blocking; registration not blocked; inspection optional.

**4A exit criteria:** ✅ Admin approves driver docs; driver uploads PDF; compliance-status API; prod CRUD unchanged. Verified on Vercel/Heroku July 7, 2026.

### Phase 4B — Expiry + reactivation gates *(after 4A)*

| Item | Status |
|------|--------|
| Nightly job marks documents `EXPIRED` (`manage.py expire_compliance_documents`) | Done — **Todo:** schedule on Heroku Scheduler (daily) |
| `reactivate_vehicle()` checks registration + commercial insurance | Done |
| `GET /api/vehicles/{id}/compliance-status/` for admin checklist | Done |
| Mobile expiry banners + admin reactivate checklist | Done |
| Admin approve: prompt/set **expiry_date** when missing (registration, insurance, licence) | Done — prod verified July 2026 |
| Admin driver panel: show **driver licence only** (not vehicle docs duplicated) | Done |
| Mobile: surface API error body on compliance verify failure (not generic “request failed”) | Done |
| Driver upload: require **expiry date** on submit for licence / registration / insurance | Done |
| Cleanup misclassified test uploads (`cleanup_misclassified_driver_documents`) | Done — run on Heroku after deploy |

**4B exit criteria:** ✅ Inactive vehicle cannot reactivate without verified, non-expired registration + commercial insurance; expired verified docs flip to `EXPIRED` via nightly job; admin approve + upload flows require expiry; Jack Frost E2E passes on prod.

### Phase 4C — Dispatch assignment gate *(implemented July 2026)*

| Item | Status |
|------|--------|
| `is_driver_eligible_for_dispatch()` real enforcement | Done |
| Block `DeliveryAssignment` when non-compliant | Done |
| Admin assign UI shows eligibility before save | Done — Admin Deliveries → detail → Assign driver |
| `GET /api/drivers/{id}/dispatch-eligibility/` | Done |
| `cleanup_misclassified_driver_documents` management command | Done — dry-run by default; `--apply` to reject |

### Phase 4D — Compliance ops UX & notifications *(after 4B)*

From BC requirements doc: admin visibility + expiry reminders. **MVP-recommended.**

| Item | Status | Priority |
|------|--------|----------|
| Admin compliance inbox (pending approvals across all drivers) | **Backend API Done** — `GET /api/compliance/admin/inbox/`; mobile UI Todo | High |
| Admin list: drivers/vehicles with **expired** or **expiring soon** docs | **Backend API Done** — `GET /api/compliance/admin/expiring/`; mobile UI Todo | High |
| Compliance summary on admin home (counts: pending / expired / active) | **Backend API Done** — `GET /api/compliance/admin/summary/`; mobile UI Todo | Medium |
| Email reminders: 30 / 14 / 0 days before document expiry | Todo | High |
| Driver dashboard: explicit expiry dates per doc type | Partial — driver compliance card shows counts; per-doc dates Todo | Medium |

**Not in 4D:** SMS/push (defer until notification service chosen).

### Phase 4E — Driver & vehicle profile gaps *(MVP nice-to-have — after compliance)*

| Item | Status | Priority |
|------|--------|----------|
| Vehicle **make / model** dropdowns (replace free text) — NA pickup trucks only | **Done** — catalog API + registration (July 2026) | High |
| Seed **vehicle make/model reference data** (Ford, GMC, Chevrolet, Toyota) | **Done** — `VehicleModelSpec` migration `0007` + `seed_demo_data` / `seed_driver_vehicle_test_data` | High |
| Vehicle **colour** field (customer/driver identification) | Todo | Medium |
| Driver **emergency contact** (name + phone) | Todo | Medium |
| BC/ICBC-aware consent copy on insurance upload | Todo | Low (copy only) |
| Optional `license_class` (default Class 5) on driver or licence doc | Todo | Low |

**v1.0 vehicle scope (make/model):** Light-duty pickup tiers only — equivalents to **Ford F-150, F-250, F-350** (half-ton / three-quarter / one-ton). **No F-450 or heavier** in v1.0.

| Make | Example models (v1.0) |
|------|------------------------|
| Ford | F-150, F-250, F-350 |
| GMC | Sierra 1500, Sierra 2500HD, Sierra 3500HD |
| Chevrolet | Silverado 1500, Silverado 2500HD, Silverado 3500HD |
| Toyota | Tundra (1500-class; align trim/GVWR with F-150 tier) |

Registration and compliance flows stay on current free-text make/model until this data load ships.

### Phase 4G — Staff accounts & RBAC *(backlog — see requirements section above)*

| Item | Status | Priority |
|------|--------|----------|
| Staff registration (admin-created accounts; optional invite) | Todo | High |
| Staff login + explicit `/api/me/` role payload | Todo | High |
| Admin UI: list / create / deactivate staff | Todo | High |
| Admin UI: assign roles (`Super Admin`, `Operations Admin`, `Compliance Reviewer`, `Read Only`) | Todo | High |
| Backend permission matrix + DRF enforcement | Todo | High |
| Staff dashboard with permission-filtered navigation | Todo | High |
| Staff role change audit log | Todo | Medium |
| Staff password reset flow | Todo | Medium |

**Depends on:** Phase 4D admin surfaces (compliance inbox) for Compliance Reviewer role to be useful.  
**Blocks:** Scaling ops beyond a single shared admin password.

### Phase 4F — Trust & safety *(post-MVP / v1.1 — optional)*

Document lists as good practice; **not required** for BC Class 5 local delivery MVP.

| Item | Status | Verdict |
|------|--------|---------|
| Pre-shift vehicle safety checklist (tires, lights, brakes…) | Todo | Optional — backlog |
| Criminal record check upload + expiry | Todo | Defer |
| Driver abstract (ICBC) upload + expiry | Todo | Defer |
| Work eligibility document | Todo | Defer |
| Selfie + licence photo match | Todo | Defer — needs vendor or manual ops |
| Municipal **business licence** document type | Todo | Optional |
| **GST number** on driver profile | Todo | Optional — if contractor reporting needed |

### Phase 4 — Other product items

- Large-item domain (dimensions, capacity matching, estimates) — see workspace `project-docs/AUTOMATED_BUILD_PLAN.md`
- **Vehicle `disposed` status** — third lifecycle state (distinct from inactive); staff-only

---

## Phase 6 — Payments & operations *(post-MVP)*

From requirements doc “Delivery Management System” modules — **after** compliant dispatch loop works.

| Item | Status | Notes |
|------|--------|-------|
| Driver payouts / direct deposit | Todo | Requires banking + tax policy; **SIN not in MVP** |
| Customer payments (Stripe) | Todo | Listed in prior roadmap |
| Invoicing / GST reporting | Todo | Only if fleet revenue model requires |
| Route tracking / map dispatch board | Todo | Doc: future enhancement |
| Reporting & analytics (delivery + compliance) | Todo | Start with 4D compliance reports |
| Push / SMS notifications | Todo | After email reminders in 4D |

---

## Phase 5 — Commercial fleet / v2.0 *(deferred)*

**Not v1.0.** Target when moving from single-driver to commercial multi-driver operations.

| Item | Notes |
|------|--------|
| **Dispatcher** role | Assign routes/deliveries within org; not full admin |
| **Multi-tenant organizations** | `Organization`, membership, org-scoped data isolation |
| **Org-scoped RBAC** | Permission classes + queryset mixins; extend existing services |
| **Frontend** | Dispatcher screens, org context, `/api/me/` role payload |
| **Heavy commercial vehicles** | Ford **F-450+**, medium-duty trucks, fleet GVWR above v1.0 cap — **commercial app only**; separate capacity/compliance rules |

Do not add org or dispatcher abstractions until Phase 5 begins. See `project-docs/ARCHITECTURE.md`. v1.0 caps vehicles at F-350–class pickups (see Phase 4E).

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
