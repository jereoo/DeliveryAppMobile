# Phase 4A — Driver & Vehicle Legal Documentation

**Status:** Not started  
**Last updated:** June 12, 2026  
**Product context:** v1.0 single fleet (Admin, Driver, Customer) — **no multi-tenant**  
**Architecture:** Layered — models thin; `compliance_service.py` SSOT; DRF permissions; mobile `complianceService.ts`  
**Later phases:** 4B (expiry + reactivate gates), 4C (dispatch assignment gate) — see `docs/PROJECT_PLAN.md`

---

## 1. Business goal

Commercial delivery requires verified legal documentation before a driver/vehicle is used for paid deliveries.

| Document | Subject | Purpose |
|----------|---------|---------|
| **Driver license** | Driver | Identity + legal authorization to drive (`license_number` exists; add verification + optional file) |
| **Vehicle registration** | Vehicle | Proof vehicle is registered for road use |
| **Commercial insurance** | Vehicle | **Personal auto policies exclude commercial delivery** — must record commercial coverage |
| **Inspection** *(optional in 4A)* | Vehicle | Jurisdiction-dependent; defer hard requirement if needed |

**Principles:**

- Backend enforces eligibility (Phase 4C); Phase 4A is **registry + display** only — no assignment blocking yet
- Admin verifies documents; driver uploads own docs
- Do not break existing vehicle SSOT (`update_vehicle`) or prod CRUD

---

## 2. Architecture alignment

| Layer | Responsibility |
|-------|----------------|
| **Models** | `LegalDocument` metadata + FKs to Driver/Vehicle (thin) |
| **Services** | `compliance_service.py` — create, list, verify, status summaries |
| **Permissions** | Who can upload / view / verify (admin vs driver own resources) |
| **ViewSets** | HTTP only — delegate to compliance service |
| **Serializers** | Field validation, file metadata |
| **Mobile `complianceService.ts`** | API calls, upload flow, error parsing |
| **Mobile components** | Forms, status badges — no business rules |

**Do NOT in Phase 4A:**

- Add `organization_id` (Phase 5)
- Duplicate logic in Admin vs Driver screens
- Put eligibility rules in ViewSets or React components
- Require documents at public driver registration (soft launch; admin backfill OK)

---

## 3. Phase 4A scope (MVP document registry)

**Goal:** Store and display legal document **metadata**; optional file upload; **no dispatch/assignment blocking**.

**Exit criteria:**

- Admin can list/verify documents for any driver or vehicle
- Driver can upload and view own driver + assigned vehicle documents
- Compliance status endpoint returns summary (pending / verified / expired counts)
- Existing `Driver.active`, `Vehicle.active`, and assignment flows **unchanged**
- Tests cover service + permissions + API

---

## 4. Data model

### `LegalDocument`

| Field | Type | Notes |
|-------|------|-------|
| `document_type` | enum | `DRIVER_LICENSE`, `VEHICLE_REGISTRATION`, `COMMERCIAL_INSURANCE`, `INSPECTION` |
| `driver` | FK nullable | Subject when type is driver license |
| `vehicle` | FK nullable | Subject when type is registration / insurance / inspection |
| `policy_number` | CharField nullable | Insurance / registration reference |
| `issuer` | CharField nullable | Carrier, DMV, etc. |
| `coverage_type` | enum nullable | `COMMERCIAL`, `PERSONAL`, `OTHER` — insurance only |
| `effective_date` | Date nullable | |
| `expiry_date` | Date nullable | Required for verified insurance/registration in 4B |
| `file` | FileField or URL | See storage §5 |
| `status` | enum | `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED` |
| `verified_by` | FK User nullable | Staff only |
| `verified_at` | DateTime nullable | |
| `rejection_reason` | Text nullable | |
| `notes` | Text nullable | Admin notes |
| `created_at` / `updated_at` | DateTime | |

**Constraints:**

- Driver license → `driver` required, `vehicle` null
- Registration / insurance / inspection → `vehicle` required
- At most one **current VERIFIED** commercial insurance per vehicle (service-enforced)

**Migration:** Additive only — no changes to `Driver` / `Vehicle` core fields in 4A.

---

## 5. File storage

| Option | Recommendation |
|--------|----------------|
| **AWS S3** (private bucket + django-storages) | **Preferred** for production |
| **Cloudinary** | Acceptable for faster MVP |
| **Metadata-only** | Fastest; files kept offline — not recommended long-term |

**Rules:**

- Never store files on Heroku ephemeral disk
- Backend issues **presigned upload URLs**; mobile uploads direct to storage
- Download via presigned GET or authenticated proxy endpoint
- PII/compliance: private bucket, encrypted at rest (S3 default)

**Env vars (Heroku):** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`

---

## 6. Service layer (`delivery/compliance_service.py`)

| Function | Responsibility |
|----------|----------------|
| `create_document(user, data, file_meta)` | Validate subject access; set `PENDING` |
| `list_documents_for_driver(driver)` | All docs for driver + assigned vehicle(s) |
| `list_documents_for_vehicle(vehicle)` | Vehicle-scoped docs |
| `get_compliance_summary(driver)` | Counts + flags for dashboard |
| `mark_verified(staff_user, document_id, notes)` | Admin only; set `VERIFIED` |
| `mark_rejected(staff_user, document_id, reason)` | Admin only |
| `is_vehicle_compliant(vehicle)` | **Stub in 4A** — always permissive or informational only; full logic in 4B |
| `is_driver_eligible_for_dispatch(driver)` | **Stub in 4A** — full logic in 4C |

**Commercial insurance rule (document in service, enforce in 4B/4C):**

- Coverage type must be `COMMERCIAL` for delivery use
- `status == VERIFIED` and `expiry_date >= today`

---

## 7. API endpoints

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET | `/api/drivers/{id}/documents/` | Admin; driver (own id) | List driver documents |
| POST | `/api/drivers/{id}/documents/` | Admin; driver (own id) | Upload / register metadata |
| GET | `/api/vehicles/{id}/documents/` | Admin; driver (assigned vehicle) | List vehicle documents |
| POST | `/api/vehicles/{id}/documents/` | Admin; driver (assigned vehicle) | Upload / register metadata |
| GET | `/api/documents/{id}/` | Admin; owner | Detail |
| PATCH | `/api/documents/{id}/` | Admin; owner (metadata only while PENDING) | Update before verify |
| POST | `/api/documents/{id}/verify/` | Admin only | Mark verified |
| POST | `/api/documents/{id}/reject/` | Admin only | Mark rejected |
| GET | `/api/drivers/me/compliance-status/` | Driver | Summary for dashboard |
| POST | `/api/documents/presigned-upload/` | Authenticated | Get S3 presigned URL |

Reuse existing auth patterns (`IsAuthenticated` + new permission classes).

---

## 8. Permissions (DRF)

| Action | Admin | Driver |
|--------|-------|--------|
| Upload doc — own driver profile | ✅ | ✅ |
| Upload doc — own assigned vehicle | ✅ | ✅ |
| Upload doc — any driver/vehicle | ✅ | ❌ |
| View metadata — all | ✅ | ❌ |
| View metadata — own | ✅ | ✅ |
| Download file — own | ✅ | ✅ |
| Verify / reject | ✅ | ❌ |

Permission classes (examples): `CanManageLegalDocument`, `CanVerifyLegalDocument`.

---

## 9. Mobile integration

### New module

`src/services/complianceService.ts` — mirror `vehicleService.ts`:

- `listDriverDocuments`, `listVehicleDocuments`
- `createDocument`, `uploadFileViaPresignedUrl`
- `getMyComplianceStatus`
- `parseComplianceError`

### Screens / touchpoints (Phase 4A)

| Screen | Change |
|--------|--------|
| **Admin — driver detail** | Documents tab: list, verify, reject |
| **Admin — vehicle edit/detail** | Documents tab: list, verify, reject |
| **Driver — dashboard** | “Compliance status” tile (counts + warnings) |
| **Driver — Edit My Vehicle** | Compliance summary card (read-only status) |
| **Driver registration** | Optional “Add documents later” — **do not block** registration |

No assignment blocking UI in 4A.

---

## 10. Legal / product documentation (non-code)

Create `DeliveryAppBackend/docs/COMPLIANCE.md` before coding uploads:

- Minimum commercial policy fields (carrier, policy #, limits, named insured)
- US / CA jurisdiction notes (aligned with `Customer.COUNTRY_CHOICES`)
- Document retention period
- Driver consent at upload: *“I confirm this policy covers commercial delivery use”*
- Disclaimer: system aids record-keeping; not legal advice

---

## 11. Testing

| Layer | Tests |
|-------|--------|
| `compliance_service` | Create, verify, reject; driver cannot verify; vehicle insurance subject rules |
| Permissions | Driver cannot upload to unassigned vehicle; admin can verify |
| API | CRUD + compliance-status + presigned URL smoke |
| Regression | Existing `test_driver_vehicle_crud.py` still passes |

New file: `tests/test_compliance.py`

---

## 12. GitHub issues (execution order)

| # | Issue | Repo |
|---|-------|------|
| 1 | Design: `LegalDocument` model + enums + `docs/COMPLIANCE.md` | Backend |
| 2 | Migrations + `compliance_service` + unit tests | Backend |
| 3 | DRF serializers, permissions, ViewSet/actions | Backend |
| 4 | S3 presigned upload + file download | Backend |
| 5 | `complianceService.ts` + types | Mobile |
| 6 | Admin driver/vehicle documents UI | Mobile |
| 7 | Driver compliance dashboard + upload UI | Mobile |
| 8 | Extend `PRODUCTION_SMOKE_TEST.md` — compliance paths | Docs |
| 9 | Prod deploy + manual QA checklist | Both |

---

## 13. Decision log (defaults for 4A)

| Decision | Phase 4A default |
|----------|------------------|
| Block delivery assignment? | **No** (Phase 4C) |
| Block vehicle reactivate? | **No** (Phase 4B) |
| Require docs at driver registration? | **No** — optional / admin backfill |
| File upload vs metadata-only? | **Presigned S3 upload** (fallback: metadata-only if storage blocked) |
| Inspection required? | **Optional** — insurance + registration prioritized |
| Hard vs soft reactivate gate | **Deferred to 4B** |

---

## 14. Future phases (reference only)

### Phase 4B — Expiry + reactivation gates

- Nightly job: mark docs `EXPIRED`
- `reactivate_vehicle()` calls `is_vehicle_compliant()`
- Mobile: expiry banners; admin reactivate checklist

### Phase 4C — Assignment / dispatch gate

- `assign_delivery()` calls `is_driver_eligible_for_dispatch()`
- Structured 400 errors: `{ "compliance": ["commercial_insurance_expired", ...] }`
- Admin assign UI shows eligibility before save

### Phase 5 — Commercial fleet

- Org-scoped documents; onboarding state machine; strict commercial-only enforcement at scale  
- See `.cursor/rules/v2-commercial-fleet.mdc`

---

## 15. Related docs

| Doc | Purpose |
|-----|---------|
| `docs/PROJECT_PLAN.md` | Phase roadmap |
| `docs/ARCHITECTURE.md` | Layered architecture + v1.0 scope |
| `docs/PROJECT_STATUS_20260612.md` | Latest prod QA |
| `.cursor/rules/v2-commercial-fleet.mdc` | Phase 5 deferred rules |

---

## 16. Success criteria (Phase 4A complete)

- [ ] `LegalDocument` model migrated on Heroku
- [ ] Admin can verify commercial insurance record for a vehicle
- [ ] Driver can upload insurance metadata (+ file if S3 enabled)
- [ ] `GET /api/drivers/me/compliance-status/` returns accurate summary
- [ ] No regression on vehicle/driver CRUD (prod smoke pass)
- [ ] `docs/COMPLIANCE.md` published in backend repo
