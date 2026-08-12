# DeliveryApp — Development Standards

**Version:** 1.0  
**Last updated:** August 11, 2026  
**Applies to:** `DeliveryAppBackend`, `DeliveryAppMobile`, workspace docs  
**Purpose:** Baseline expectations for **CRUD, forms, API, and tests** so humans and AI do not repeat the same instructions every session.

**Related (do not duplicate here):**

| Doc | Owns |
|-----|------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) → [`DeliveryApp/project-docs/ARCHITECTURE.md`](../../DeliveryApp/project-docs/ARCHITECTURE.md) | Layering, v1.0 scope, repo layout |
| [`DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) | DoR, DoD, iteration loop, test commands |
| [`.cursor/rules/layered-architecture.mdc`](../.cursor/rules/layered-architecture.mdc) | Enforced coding rules for agents |
| [`USE_CASES.md`](USE_CASES.md) → [`DeliveryApp/project-docs/USE_CASES.md`](../../DeliveryApp/project-docs/USE_CASES.md) | Business flows and global rules (BR-xx, UC-xx) |

---

## 1. Architecture (summary)

**Backend:** ViewSet → permission class → **service (SSOT)** → serializer → model  

**Mobile:** Component/screen → **`src/services/`** → API  

**Never:** duplicate Admin vs Driver business logic in two places; never put business rules in `App.tsx` or ViewSets.

---

## 2. Standard CRUD expectations

Unless a task spec says otherwise, every **Create / Read / Update / Delete** feature includes:

### Create & Update

- Required fields validated **on API** (serializer/service); mobile may mirror for immediate feedback
- User-friendly error messages (field-level where possible); mobile surfaces API error body — not generic “request failed”
- Duplicate/uniqueness rules enforced on backend (email, username, plate, VIN, etc.) with clear messages
- Loading state while saving; prevent double-submit
- **Destructive actions** (delete, reject, deactivate): confirm in UI where appropriate

### Read (list & detail)

- Lists load without blank-screen failures; show empty state when no rows
- **Foreign keys:** show **names/labels**, not raw database IDs (e.g. customer name, driver name, vehicle plate)
- Related data: use dropdown, searchable picker, or catalog API — not free-text IDs

### Delete & deactivate

- **Vehicle:** prefer **inactive** (`active=False`) when history exists; hard delete only when no FK history (see Phase 2 vehicle lifecycle)
- **Compliance docs:** reject/resubmit flows — do not silently drop audit history
- Admin-only hard delete where policy requires staff role

---

## 3. Common field validation

| Field | Standard |
|-------|----------|
| **Email** | Valid email format; unique where model requires |
| **Phone** | 10-digit NA (US/Canada) on admin/edit **and** public register — same rules everywhere |
| **Driver license** | `license_issuing_region` + region-aware format (`driverLicenseValidation.ts` / backend equivalent) |
| **Postal / ZIP** | Validate by country when country is known (US/CA) |
| **Address** | Required components per model; prefer shared patterns — note: `AddressAutocomplete` exists but is not wired everywhere (Phase 4H tracks parity) |
| **Vehicle make/model** | Use **vehicle catalog** (`/api/vehicle-catalog/`, `VehicleCatalogFields`) — not free text on registration |
| **Capacity** | kg/lb limits (2000 kg / 4400 lb) with conversion on driver vehicle edit |
| **Compliance upload** | PDF or image per product rules; expiry date required for licence / registration / insurance; max size enforced |

---

## 4. Foreign keys & pickers

| Pattern | When |
|---------|------|
| **Dropdown / select** | Small fixed sets (status, approval, catalog make/model, province) |
| **Searchable list / picker** | Customers, drivers, vehicles on admin forms |
| **Read-only display** | Computed or joined fields (e.g. `customer_name` on delivery read) |

**Bad:** `customer_id: 37` exposed to user  
**Good:** `Customer: [ Demo Customer ▼ ]`

---

## 5. API standards

- Authenticate protected endpoints; enforce **role** (admin / driver / customer) in permission classes
- Appropriate HTTP status codes; validation errors in consistent JSON shape
- **Admin and driver** mutations on the same resource call the **same service method** (e.g. `update_vehicle()`)
- Pagination/filter/query params documented in phase docs when adding admin list endpoints
- CORS and `EXPO_PUBLIC_BACKEND_URL` point at **truck-buddy** Heroku app in prod/CI

---

## 6. Mobile UX standards

- Use **`src/theme/index.ts`** tokens and shared styles — avoid one-off colors/spacing for new screens
- Reuse shared components when they exist (`VehicleCatalogFields`, `DriverLicenseFields`, `ComplianceDocumentsPanel`, etc.)
- **Admin list screens:** consistent filter/sort/search patterns (see PROJECT_PLAN → UX & design consistency)
- Same interaction patterns across admin vs driver where the action is the same API (vehicle update → `vehicleService.updateVehicleById`)
- Web (Vercel) and native share the same service modules

---

## 7. Testing standards

Every feature change should include **meaningful** tests — not trivia:

| Layer | Expectation |
|-------|-------------|
| **Backend** | pytest for service rules, permissions, API status codes, validation edges |
| **Mobile** | Jest for `src/services/*` helpers; smoke render tests for non-trivial new screens |
| **Regression** | Run subsets in DEVELOPMENT_PROCESS §6 when touching drivers, vehicles, auth, compliance |

**Not done:** tests failing, `continue-on-error` hacks, or deleting tests to green the build.

**Baseline (recommended):** report test count before/after on non-trivial tasks (see `AI_SESSION_STARTER.md`).

---

## 8. Compliance & dispatch (v1.0)

- Dispatch assignment must respect **compliance gate** (UC-10, BR-03) — use `compliance_service` SSOT
- Document verify/reject: admin only; rejection reason required
- Expiry: admin sets/prompts expiry on approve when missing for types that require it
- Do not bypass eligibility checks in v1.0

---

## 9. Environment & data

- **Heroku `truck-buddy`** is the primary database for migrations, seeds, and QA
- Seeds: `seed_demo_data --force` (needs `ALLOW_DEMO_SEED=1` on Heroku); destructive seeds only when explicitly requested
- Never commit secrets (`.env`, API keys, `ADMIN_PASSWORD`)
- Local Postgres `delivery_app` is stale/unused unless human refreshes local dev

---

## 10. Explicit non-goals (v1.0)

Do **not** add without a Phase 5 / v2.0 task:

- `Organization`, multi-tenant querysets, Dispatcher role
- Phone OTP (UC-01) — **Planned**, not implemented
- Auto-commit / auto-push to prod
- New frameworks or alternate architecture patterns

---

## 11. When standards conflict with a task spec

**Order of precedence:**

1. Task-specific acceptance criteria (issue, `specs/TASK-xxx.md`, phase doc e.g. PHASE_4A)
2. `USE_CASES.md` business rules
3. This document
4. General best practices

If still ambiguous → **stop and ask** (see `AI_SESSION_END_REPORT.md`).
