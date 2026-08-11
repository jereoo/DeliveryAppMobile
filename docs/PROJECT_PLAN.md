# DeliveryApp — Project Plan

**Last updated:** August 11, 2026  
**Team size:** 1–3  
**Overall status:** 🟡 Phase 1–4C **complete**; Phase 4D **in progress** — admin UI + nightly cron **Done**; compliance resubmit → approve **prod verified**; expiry **email not live** (no final domain yet); driver vehicle replace UX **still in QA**; **Phase 4H** **Done**; admin list **sort/filter parity** **Done** (`584fca4`, Aug 11); admin list **search boxes** **Done** (customers, drivers, vehicles, deliveries) — **await prod retest**  
**Current focus:** Prod-retest admin list search + filters on Vercel. Prod-retest admin **Add Delivery** (Aug 5 fixes). Prod-test driver My Vehicle replace + compliance upload after replace. Email reminders **blocked** until final domain chosen. Phase 4G (staff RBAC) **backlog**.  
**Requirements review:** [`docs/COMPLIANCE_REQUIREMENTS_REVIEW.md`](COMPLIANCE_REQUIREMENTS_REVIEW.md) (BC local delivery / pickup truck MVP)  
**Tracking:** [GitHub Issues](https://github.com/jereoo/DeliveryAppBackend/issues) + [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) (see `.github/SETUP_GITHUB_PROJECT.md`).  
**Latest status report:** `docs/PROJECT_STATUS_20260811.md` + `docs/PROJECT_LOG.md`  
**Architecture:** `docs/ARCHITECTURE.md` + `.cursor/rules/layered-architecture.mdc`  
**Business use cases:** [`docs/USE_CASES.md`](USE_CASES.md) → `DeliveryApp/project-docs/USE_CASES.md` (auth, compliance, dispatch)  
**Development process:** [`docs/DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) — plan → build → test → done

---

## Development environment *(July 2026)*

| Topic | Current setup |
|-------|----------------|
| **Primary database** | **Heroku Postgres** on app `truck-buddy` — all migrations, seeds, and QA run here (app not public yet) |
| **Local PostgreSQL** | `delivery_app` @ localhost exists but **not in use**; refresh/sync **TBD** |
| **Workspace** | Open `C:\Users\360WEB\DeliveryApp.code-workspace` (3 roots: docs, backend, mobile) |
| **DB admin** | pgAdmin → Heroku Postgres connection |
| **Heroku ops** | Dashboard → **Run console** (local Heroku CLI often not logged in) |
| **Seed on Heroku** | `ALLOW_DEMO_SEED=1 python manage.py seed_demo_data --force` · `seed_driver_vehicle_test_data --force` (wipes all drivers first) |
| **Cursor rule** | `DeliveryAppBackend/.cursor/rules/heroku-production-db.mdc` |

**Heroku QA accounts (July 22, 2026 — re-seed after deploy `dde64d8`):**

| Account | Password | Purpose |
|---------|----------|---------|
| `demo.driver` | `DemoPass1234!` | Approved driver, Ford F-150 `DEMO001`, 3 verified compliance docs |
| `demo.customer` | `DemoPass1234!` | One pending delivery |
| `test.driver.approved` … `test.driver.inactive` | `TestPass1234!` | CRUD/compliance scenarios — see `DeliveryAppBackend/docs/SEED_DATA.md` |

**Recent backend commits:** `ffdaae7` (compliance cron workflow fix) · `c13eec9` (nightly jobs + reminders) · `30b54a4` (Procfile auto-migrate) · `1e37511` (Phase 4D admin API)

**Recent mobile commits:** `262df0d` (Phase 4D admin compliance UI) · `9118dec` (admin driver list filters) · `5353a0b`–`680b00c` (driver My Vehicle, replace/resubmit compliance)

**Prod checks (July 30, 2026):** API health ✅ · Vercel web ✅ · Phase 4D `/api/compliance/admin/*` ✅ · Admin compliance inbox UI ✅ · Admin driver list filters ✅ · GitHub Actions compliance cron ✅ (dry-run verified `ffdaae7`)

**Prod verified (July 31, 2026):** Compliance resubmit after reject → admin approve — driver **PENDING → VERIFIED** (UC-13 / UC-06) ✅

**Not verified yet:** Driver My Vehicle replace flow · compliance upload after vehicle replace (`5353a0b`, `96a8142`, `680b00c`)

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
| Seed / demo data strategy for staging/production | Done — `DeliveryAppBackend/docs/SEED_DATA.md`, `seed_demo_data`, `seed_driver_vehicle_test_data`; **Heroku QA seeded July 2026** |
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
| Nightly job marks documents `EXPIRED` (`manage.py expire_compliance_documents`) | Done — via `run_compliance_daily_jobs` on GitHub Actions cron (06:00 UTC) |
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
| Admin compliance inbox (pending approvals across all drivers) | **Done** — API (`1e37511`) + mobile `AdminComplianceScreen` inbox tab (`262df0d`, prod verified) | High |
| Admin list: drivers/vehicles with **expired** or **expiring soon** docs | **Done** — API + mobile expiring tab (prod verified) | High |
| Compliance summary on admin home (counts: pending / expired / active) | **Done** — API + admin dashboard overview + compliance screen (`262df0d`) | Medium |
| Email reminders: 30 / 14 / 0 days before document expiry | **Not done** — code shipped (`send_compliance_expiry_reminders`); **blocked:** no final domain name for sender email; until then reminders log to console only (Heroku `EMAIL_*` setup deferred) | High |
| Driver dashboard: explicit expiry dates per doc type | Partial — driver compliance card shows counts + expiry on verified docs; full per-type list Todo | Medium |
| Schedule nightly `run_compliance_daily_jobs` | **Done** — GitHub Actions `compliance-daily-jobs.yml` (06:00 UTC); verified run `30509255544` (`ffdaae7`) | High |

**Phase 4D backend docs:** `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md`

**Not in 4D:** SMS/push (defer until notification service chosen).

### Phase 4E — Driver & vehicle profile gaps *(MVP nice-to-have — after compliance)*

| Item | Status | Priority |
|------|--------|----------|
| Driver `license_issuing_region` + format validation | **Done** — migration `0006`, registration API + mobile (`3b32091` / `e2aa00d`) | High |
| Vehicle **make / model** catalog dropdowns (NA pickup trucks) | **Done** — `VehicleModelSpec` migration `0007`, `/api/vehicle-catalog/`, mobile `VehicleCatalogFields` (`19f8f2d` / `af7b229`) | High |
| Seed **vehicle make/model reference data** | **Done** — `vehicle_catalog_data.py` + `seed_demo_data` / `seed_driver_vehicle_test_data` | High |
| Driver self-edit **structured address** block | **Done** — `DriverProfileEditScreen` (unit, street, city, state, postal, country) | High |
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

Catalog enforced on **driver registration** (`vehicle_model_spec_id` required). Admin/driver vehicle edit still uses catalog-backed make/model from spec.

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

### Phase 4H — Form & screen field parity *(Done — August 2026; post-deploy fixes Aug 5)*

**Problem:** Register, create, edit, and admin screens for the same entity expose **different fields**, use **different validation**, or send **payload keys the API does not accept**. Example: driver self-edit now has structured address, but driver register and admin driver forms do not; admin delivery form edits `customer_name` / `customer_address` but backend `DeliverySerializer` has no writable `customer_address` and `customer_name` is read-only.

**Scope:** All forms in **DeliveryAppMobile** (`App.tsx`, `src/screens/`, shared `src/components/`). Web UI is exported from this repo via Expo → Vercel.

**Post-deploy production issues (Aug 5, 2026)** — discovered after Phase 4H shipped to Vercel + Heroku:

| # | Issue | Root cause | Fix | Status |
|---|--------|------------|-----|--------|
| 1 | Chrome popup: *“Access other apps and services on this device”* + red **Failed to fetch** on pickup/dropoff when typing in admin Add Delivery | `addressValidationService` used `process.env.BACKEND_URL \|\| localhost:8000` instead of shared `getApiUrl()` / `EXPO_PUBLIC_BACKEND_URL` on Vercel | Mobile `36751b7` — `src/services/addressValidation.ts` | ✅ **Deployed** — await prod retest |
| 2 | Admin **Add Delivery** did not save (especially with **Same pickup as customer address** on) | Staff `POST /deliveries/` used `DeliverySerializer` which rejected blank `pickup_location` / `dropoff_location` even when `same_*_as_customer` flags were set (customer `request_delivery` path already allowed blanks) | Backend `9f421dc` — shared `_validate_delivery_location_fields()` + require `customer` on staff create | ✅ **Deployed** — await prod retest |
| 3 | Create failed silently — form returned to list with no new delivery | `createDelivery` in `App.tsx` caught API errors but did not rethrow; `AdminDeliveriesScreen` treated call as success | Mobile `38a62cb` — rethrow after alert; show API message on form | ✅ **Deployed** — await prod retest |
| 4 | Customer picker looked like one undifferentiated list; easy to miss selection | Each customer rendered as a native `Button` (poor web styling) | Mobile `38a62cb` — `Pressable` rows with ✓ + highlight; helper text | ✅ **Deployed** — await prod retest |
| 5 | User thought “demo customers” do not exist | Picker lists real Heroku data: `demo.customer` (**Demo Customer**) from `seed_demo_data` plus bulk test customers from `create_test_data` (e.g. Mike Hernandez) | No code change — documentation / UX clarity above | ℹ️ **Clarified** |

**Prod retest checklist (admin Add Delivery):**

1. Hard-refresh `deliveryapp-mobile.vercel.app`
2. Tap a customer row (✓ + highlight) — e.g. **Demo Customer**
3. Enter pickup/dropoff manually **or** enable same-as-customer toggles
4. Tap **Create** — on error, stay on form with message; on success, delivery appears in list

**Status report:** `docs/PROJECT_STATUS_20260805.md`

**Screen inventory (reference):**

| Screen | Path | Mode |
|--------|------|------|
| Customer register | `App.tsx` (`customer_register`) | Register |
| Customer admin create/edit | `AdminCustomersScreen.tsx` | Create / Edit |
| Customer self profile edit | — | **Missing** |
| Driver register (active) | `RegisterAsDriverScreen.tsx` | Register |
| Driver register (legacy) | `App.tsx` (`driver_register`) | Register — **orphaned, not in menu** |
| Driver self profile edit | `DriverProfileEditScreen.tsx` | Edit |
| Driver admin create/edit | `AdminDriversScreen.tsx` | Create / Edit |
| Delivery request (customer) | `DeliveryRequestScreen.tsx` | Create |
| Delivery admin create/edit | `AdminDeliveriesScreen.tsx` | Create / Edit |
| Vehicle admin create/edit | `AdminVehiclesScreen.tsx` | Create / Edit |
| Driver vehicle replace/resubmit | `DriverVehicleOnboardingForm.tsx` | Create-like |
| Compliance upload | `ComplianceDocumentsPanel.tsx` | Create / resubmit |

**Shared structured address block** (backend: `address_unit`, `address_street`, `address_city`, `address_state`, `address_postal_code`, `address_country`):

| Screen | Address block |
|--------|:-------------:|
| Customer register | ✅ |
| Customer admin create/edit | ✅ |
| Customer self edit | ❌ (no screen) |
| Driver register | ❌ |
| Driver self edit | ✅ |
| Driver admin create/edit | ❌ |
| Delivery pickup/dropoff | ❌ (free-text only) |

**Cross-cutting gaps:**

| # | Gap | Affected screens |
|---|-----|------------------|
| 1 | **`AddressAutocomplete` unused** — component + validation service exist; all addresses are plain `TextInput` | Customer, driver, delivery |
| 2 | **Phone validation inconsistent** — 10-digit NA enforced on admin/edit; public register accepts raw input | `App.tsx` register, `RegisterAsDriverScreen` |
| 3 | **Required-field labeling** — backend requires customer `first_name` / `last_name` / `phone_number`; public register does not mark or validate | `App.tsx` customer register |
| 4 | **Duplicate driver registration** — `RegisterAsDriverScreen` (active) vs `App.tsx` `driver_register` (legacy, missing confirm_password) | Driver register |
| 5 | **Vehicle identity split** — driver paths use catalog (`vehicle_model_spec_id`); admin vehicle uses free-text make/model + manual capacity | Driver register/replace vs `AdminVehiclesScreen` |

#### P0 — Critical (broken or blocks users)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | **Customer profile edit** — new screen + `PATCH /customers/me/` (backend action today is GET-only) | **Done** — `CustomerProfileEditScreen` + `CustomerMeSerializer` | Customers can update address/phone/preferred pickup after signup |
| 2 | **Admin delivery create/edit** — replace `customer_name` / `customer_address` with **customer FK picker** | **Done** — `AdminDeliveriesScreen` customer picker + `buildDeliveryAdminPayload` | Uses `customer` FK aligned with `DeliverySerializer` |

#### P1 — High (field parity + backend alignment)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3 | **Shared address block** on driver register + driver admin create/edit | **Done** — `AddressFields` on register + admin driver forms | Matches customer + driver self-edit |
| 4 | **Delivery scheduling fields** — `delivery_date`, `delivery_time`, `special_instructions`, `same_dropoff_as_customer` on customer request + admin forms | **Done** | Customer + admin delivery forms |
| 5 | Wire **`AddressAutocomplete`** into profile and delivery location fields | **Done** — customer/driver profile, delivery request, admin delivery | Reuses `AddressAutocomplete.tsx` |
| 6 | **`license_issuing_region`** on driver profile edit (with region-aware validation) | **Done** — `DriverMeSerializer` + `DriverLicenseFields` on profile edit | Editable after registration |
| 7 | **10-digit phone validation** on all public register forms | **Done** — customer register + driver register | Aligns with admin/edit screens |

#### P2 — Medium (consistency + cleanup)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8 | **Unify vehicle catalog** — admin vehicle create uses catalog (`vehicle_model_spec_id`) like driver register/replace | **Done** — `VehicleCatalogFields` on admin vehicle create | Auto-fills make/model/capacity |
| 9 | **Admin driver create** — clarify/fix user account creation (`POST /drivers/` has read-only `user`; staff may need dedicated endpoint or registration-style flow) | **Done** — `StaffDriverCreateSerializer` + admin form account fields | Creates User + Driver |
| 10 | **Compliance upload: `effective_date`** field | **Done** — upload form field + payload | Backend field exposed in UI |
| 11 | **Customer delivery cancel/edit** (customer-facing) | **Done** — `POST /deliveries/{id}/cancel/` + My Deliveries cancel button | Pending deliveries only |

#### P3 — Low (debt)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12 | Remove legacy **`App.tsx` `driver_register`** block | **Done** | Use `RegisterAsDriverScreen` only |
| 13 | Extract **shared form sections** — address block, phone input, account fields — into reusable components | **Done** — `AddressFields` component | Used across profile/register/admin forms |

**Backend gaps to address with Phase 4H UI work:** *(all addressed in Phase 4H + Aug 5 follow-up)*

| API | Gap | Status |
|-----|-----|--------|
| `GET/PATCH /customers/me/` | PATCH not implemented — only GET today | ✅ Done — `CustomerMeSerializer` |
| `DriverSerializer` (admin) | No address fields; driver address only via `DriverMeSerializer` | ✅ Done |
| `DriverSerializer` | No `license_issuing_region` on update | ✅ Done |
| `DeliverySerializer` | `customer_name` read-only; no `customer_address` — use `customer` FK | ✅ Done — picker + Aug 5 location validation parity |

**Phase 4H exit criteria:** ✅ **Met** (Aug 4–5, 2026)

- Customer can edit own profile (address, phone, preferred pickup) after registration.
- Admin delivery create/edit uses customer picker; no phantom `customer_address` field.
- Driver register and admin driver forms include the same structured address block as driver self-edit.
- Customer and driver delivery forms expose date/time, special instructions, and dropoff shortcut flags supported by backend.
- Public registration forms use the same phone validation as admin/edit screens.
- `AddressAutocomplete` used on at least customer address, driver address, and delivery location fields.
- **Aug 5 addendum:** Admin delivery saves with same-as-customer toggles; address validation hits production API on Vercel; create errors visible on form.

**Audit reference:** `docs/PROJECT_STATUS_20260804.md` (audit) · `docs/PROJECT_STATUS_20260805.md` (post-deploy fixes) · `DeliveryApp/project-docs/PROJECT_STATUS_20260805.md`

### Phase 4 — Other product items

- Large-item domain (dimensions, capacity matching, estimates) — see workspace `project-docs/AUTOMATED_BUILD_PLAN.md`
- **Vehicle `disposed` status** — third lifecycle state (distinct from inactive); staff-only
- **Admin drivers list filters** — **Done** (`9118dec`, prod verified July 29, 2026) — **extended to all admin list screens** Aug 11, 2026 (`584fca4`); see UX section → Admin list filters
- **Admin list sort/filter parity (all manage screens)** — **Done** (`584fca4`) — customers, deliveries, vehicles, driver–vehicles, compliance ops; shared `AdminListFilterBar` + `AdminFilteredListMeta`; filter logic in services — **await prod retest**
- **Admin list text search** — **Done** (Aug 11) — `AdminListSearchField` on customers (name), drivers (name), vehicles (plate), deliveries (`#id`); `matchesAdminTextSearch()` in services — **await prod retest**
- **Compliance resubmit → admin approve** — **Done** — prod verified July 31, 2026 (UC-13 / UC-06; `5353a0b`–`680b00c` + approve-after-resubmit fix)
- **Driver My Vehicle replace + upload after replace** — **In QA** (`5353a0b`, `96a8142`, `680b00c`) — replace vehicle, upload compliance on new truck, profile field labels, catalog capacity auto-fill (`9174cd8`, `ddf0b7b`)
- **Form & screen field parity (Phase 4H)** — **Done** — shipped Aug 4–5, 2026 (`4140587`, `e413ab7`, `36751b7`, `9f421dc`, `38a62cb`); post-deploy admin delivery + address autocomplete fixes **await prod retest** — see Phase 4H post-deploy table

### UX & design consistency *(ongoing — product standard)*

**Principle:** The whole app must have a **consistent look and feel**. All screens should follow the **same UX patterns** wherever it is possible or makes sense — not only matching **fields/API parity** (Phase 4H) but also **layout, interaction, feedback, and visual language**.

**Why it matters:** Inconsistent screens confuse users and hide bugs (e.g. Aug 5 admin delivery: native `Button` customer list looked like one block; create errors returned to list while other forms use inline errors).

**Source of truth (mobile):**

| Layer | Location | Use for |
|-------|----------|---------|
| Theme tokens | `src/theme/index.ts` — `theme`, `styles` | Colors, typography, spacing, inputs, cards, errors |
| Shared form sections | `src/components/` — e.g. `AddressFields`, `DriverLicenseFields`, `VehicleCatalogFields` | Reuse across register / admin / self-edit |
| Services | `src/services/` | Validation and error messages — not duplicated inline in screens |

**Standard screen patterns (apply to new work and refactors):**

| Pattern | Convention |
|---------|------------|
| **Screen shell** | `ScrollView` + `styles.container` / `styles.content`; title via `styles.title`; section headers via `styles.sectionTitle` |
| **Forms** | `styles.label` + `styles.input`; errors via `styles.fieldError` / red inline text above actions — **stay on screen** on failure |
| **Required fields** | Label with `*` or explicit helper text |
| **Lists / pickers** | Selectable rows (`Pressable` + highlight + ✓), not stacked native `Button`s on web |
| **Admin list filters** | `AdminListFilterBar` + per-entity filter component + **`AdminListSearchField`** where applicable; `filterAndSort*` / `filter*` in `src/services/`; `AdminFilteredListMeta` (“Showing X of Y”, clear filters) |
| **Toggles** | `styles.switchContainer` + `styles.switchLabel` |
| **List + detail CRUD** | List → detail → edit/create; Back + primary action at bottom; same empty-state copy (`styles.emptyText`) |
| **Loading** | `ActivityIndicator` + disable primary button while submitting |
| **Success / error** | Inline error on form; `Alert` optional for confirm/success — **do not navigate away on silent failure** |

**When screens may differ:** Role-specific dashboards and compliance upload flows may add extra steps, but should still use shared theme, inputs, and error handling.

**Known gaps (backlog — align over time):**

| Gap | Example | Target pattern |
|-----|---------|----------------|
| Mixed controls | Admin delivery customer list was all `Button`s | Selectable `Pressable` rows (fixed Aug 5 — apply elsewhere) |
| Inline one-off styles | Ad-hoc `style={{ … }}` instead of `theme` / `styles` | Extend `src/theme/index.ts` or shared components |
| Error handling split | Some flows Alert-only, some inline, some swallowed | Inline error on form + rethrow from `App.tsx` CRUD helpers |
| Screen headers | Back button placement varies | Shared header component (future P3) |
| Duplicate form blocks | Similar address/account blocks copied | Reuse `AddressFields` and future shared sections |
| Admin list filter parity | Only Manage Drivers had filters (July 2026) | **Done Aug 11** — all admin list screens; retest on Vercel |

**Admin list filters + search (Aug 11, 2026 — `584fca4`, `ec30659`, follow-up):**

| Screen | Filters / sort | Text search |
|--------|----------------|-------------|
| **Drivers** | Last name (Z→A), account status, approval status | Driver name (partial) |
| **Customers** | Last name, account status, business vs individual, country (US/CA) | Customer name (partial) |
| **Deliveries** | Status, customer, sort (newest / oldest / customer A→Z) | Delivery number / `#id` |
| **Vehicles** | Operational status, approval status, sort (plate / make-model / year) | License plate |
| **Driver–vehicles** | Active vs completed, driver, plate, sort (assigned date / driver / plate) | — |
| **Compliance ops** | Document type, driver vs vehicle subject, document status | — |

**Shared components:** `AdminListFilterBar`, `AdminListSearchField`, `AdminFilteredListMeta`, `src/utils/adminListFilterUtils.ts`

**Gate for new screens / major edits:** Before marking UI work Done, confirm it reuses theme + shared components where they exist and matches the patterns above (or documents a deliberate exception in the PR).

**Related:** Phase 4H (field parity) · `docs/ARCHITECTURE.md` (frontend UX) · `docs/DEVELOPMENT_PROCESS.md` (DoD UX checkbox)

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

Local workspace: `C:\Users\360WEB\DeliveryApp.code-workspace` → **DeliveryApp** (docs), **DeliveryAppBackend**, **DeliveryAppMobile**.

---

## How to track work in GitHub

1. Create a **GitHub Project** (Board): *Projects → New project → Board*.
2. Add columns: **Backlog**, **In progress**, **Done**.
3. Create **Issues** from the Phase 1 table (one issue per row, or group small items).
4. Link PRs with `Fixes #issue` in the description.

See [`.github/SETUP_GITHUB_PROJECT.md`](../.github/SETUP_GITHUB_PROJECT.md) for step-by-step clicks.

**Process:** Every item follows [`docs/DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) (DoR → implement → test → record). PRs use [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md).
