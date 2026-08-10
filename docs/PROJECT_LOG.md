# DeliveryApp — Project Log

Chronological decisions and implementation notes. Latest status reports: `PROJECT_STATUS_*.md`.

---

## August 5, 2026 — Phase 4H post-deploy: admin Add Delivery + address autocomplete (prod fixes)

**Environments:** Vercel `deliveryapp-mobile.vercel.app` + Heroku `truck-buddy`

### Issues reported (admin Add Delivery)

1. **Chrome “Access other apps and services on this device”** popup and **Failed to fetch** when typing pickup/dropoff — `AddressAutocomplete` called `localhost:8000` from HTTPS Vercel site (Local Network Access prompt).
2. **Delivery did not save** — often with **Same pickup as customer address** enabled; API returned 400 because staff `DeliverySerializer` rejected blank locations (customer path already allowed blanks via `DeliveryCreateSerializer`).
3. **Silent failure UX** — form navigated back to list even when create failed.
4. **Customer picker confusion** — list is real DB data (`demo.customer`, test customers from `create_test_data`); web `Button` styling obscured selection.

### Fixes shipped

| Repo | Commit | Change |
|------|--------|--------|
| DeliveryAppMobile | `36751b7` | `addressValidationService` → `getApiUrl()` (Heroku, not localhost) |
| DeliveryAppBackend | `9f421dc` | Shared `_validate_delivery_location_fields()`; staff create allows blank pickup/dropoff with same-as-customer flags; require `customer` |
| DeliveryAppMobile | `38a62cb` | Rethrow CRUD errors; inline API messages; `Pressable` customer picker; richer `parseDeliveryApiError` |

### Status

✅ **Committed and pushed** to `main` (Heroku + Vercel auto-deploy).  
🟡 **Awaiting prod retest** — admin Add Delivery with customer selection + same-as-customer toggles + address fields.

**Status report:** `docs/PROJECT_STATUS_20260805.md` · `docs/PROJECT_PLAN.md` Phase 4H post-deploy table

### UX consistency (product standard)

Documented requirement: **all screens should follow consistent design/UX patterns** where possible so the whole app has a unified look and feel — not only field parity (Phase 4H). Added to `PROJECT_PLAN.md`, `ARCHITECTURE.md`, and `DEVELOPMENT_PROCESS.md` (DoD checkbox). Aug 5 admin delivery customer picker is the reference example of what to avoid (stacked `Button`s) vs target (`Pressable` selectable rows + theme tokens).

---

## August 4, 2026 — Screen audit: form & field parity (Phase 4H planned)

**Scope:** DeliveryAppMobile screens vs DeliveryAppBackend serializers/models

### Findings (summary)

- **Customer:** register + admin forms aligned; **no self-service profile edit**; backend `GET /customers/me/` only.
- **Driver:** self-edit has structured address ✅; register and admin driver forms lack address; `license_issuing_region` only at registration.
- **Delivery:** customer + admin forms missing `delivery_date`, `delivery_time`, `special_instructions`, `same_dropoff_as_customer`; admin form uses non-writable `customer_name` / phantom `customer_address`.
- **Cross-cutting:** `AddressAutocomplete` unused; phone validation inconsistent on public register; duplicate legacy driver register in `App.tsx`; admin vehicle free-text vs driver catalog split.

### Plan update

- Added **Phase 4H — Form & screen field parity** to `docs/PROJECT_PLAN.md` with P0–P3 task table and exit criteria.
- Marked driver self-edit structured address as **Done** in Phase 4E.

**Status report:** `docs/PROJECT_STATUS_20260804.md` · `DeliveryApp/project-docs/PROJECT_STATUS_20260804.md`

---

## July 31, 2026 — Compliance resubmit → admin approve (prod verified)

**Environments:** Vercel web + Heroku `truck-buddy`

### Prod verification

| Test | Result |
|------|--------|
| Driver resubmits rejected compliance document | ✅ Pass — status **PENDING** |
| Admin approves from Compliance ops inbox | ✅ Pass |
| Status **PENDING → VERIFIED** (admin + driver) | ✅ Pass |

**Use cases:** UC-13 (re-submit document) · UC-06 (review & verify)

**Status report:** `docs/PROJECT_STATUS_20260731.md`

### Still open (vehicle lifecycle QA)

- Driver My Vehicle replace flow
- Compliance upload after vehicle replace

---

## July 30, 2026 — Compliance daily jobs GitHub Actions cron verified

**Environments:** GitHub Actions + Heroku `truck-buddy`

### Shipped

| Commit | Repo | Change |
|--------|------|--------|
| `b63a2b6` | Backend | GitHub Actions workflow `compliance-daily-jobs.yml` (06:00 UTC cron) |
| `2ed039c` | Backend | Fix dyno polling — by name, handle 404 on ephemeral one-offs |
| `ffdaae7` | Backend | Poll via dyno **list** endpoint; treat removed dyno as success |

### Verification

| Test | Result |
|------|--------|
| GitHub Actions → Compliance Daily Jobs (dry-run) | ✅ Pass — run [30509255544](https://github.com/jereoo/DeliveryAppBackend/actions/runs/30509255544) |
| One-off dyno start on Heroku | ✅ Pass |
| Wait step (dyno list poll) | ✅ Pass — `starting` → dyno removed from list → exit 0 |

### Root cause (failed run `30508907891`)

Initial workflow polled `GET /apps/.../dynos/{id}` with `curl -f`. One-off `run.*` dynos are deleted when finished → 404 → curl exit 22. Re-running **failed jobs** on old commit `b63a2b6` would still fail; must run from current `main`.

### Open (Phase 4D)

- Heroku: set `EMAIL_*` SMTP vars so reminders send (currently console-only without SMTP)

---

## July 29, 2026 — Phase 4D mobile deploy + admin driver list filters

**Environments:** Vercel web + Heroku `truck-buddy`

### Shipped

| Commit | Repo | Change |
|--------|------|--------|
| `262df0d` | Mobile | Phase 4D admin compliance ops UI — inbox, expiring docs, dashboard summary |
| `9118dec` | Mobile | Admin **Manage Drivers** filters — last name dropdown (list sorted Z→A), account status, approval status |
| `1e37511` | Backend | Phase 4D admin API (`/api/compliance/admin/summary|inbox|expiring/`) — already on prod |

### Prod verification (July 29, 2026)

| Test | Result |
|------|--------|
| Admin → Compliance inbox | ✅ Pass — pending/expiring tabs, approve/reject |
| Admin → Dashboard compliance overview | ✅ Pass |
| Admin → Manage Drivers → filter dropdowns | ✅ Pass — last name, account status, approval status |
| CI + Vercel deploy | ✅ Pass — `9118dec` verified via GitHub Actions |

### Implementation notes (driver filters)

- Filter logic in `src/services/driverService.ts` (`filterAndSortAdminDrivers`, `getUniqueDriverLastNames`)
- UI in `src/components/AdminDriverListFilters.tsx` (`@react-native-picker/picker`)
- Unit tests: `src/__tests__/driverService.test.ts`

### Open (Phase 4D)

- Heroku: set `EMAIL_*` SMTP vars (reminders code shipped; needs SendGrid or similar)

---

## July 29, 2026 — Phase 4D nightly jobs + email reminders (backend)

| Item | Implementation |
|------|----------------|
| Email reminders 30/14/0 days | `compliance_reminder_service.py`, `send_compliance_expiry_reminders` |
| Combined nightly job | `run_compliance_daily_jobs` |
| Reminder dedup | Migration `0008` on `LegalDocument` |
| GitHub Actions cron | `compliance-daily-jobs.yml` — verified `ffdaae7` |
| Procfile release phase | Auto-migrate on deploy (`30b54a4`) |

---

## June 3, 2026 — Phase 4A compliance file upload plan

**Context:** Phase 4A shipped metadata-only compliance (register, verify, reject). No file picker or S3 upload yet. `LegalDocument.file_key` / `file_name` exist; `POST /api/documents/presigned-upload/` returns 400 until storage is wired.

### Storage (not Heroku disk)

- **Never** store uploads on Heroku ephemeral disk.
- **Production:** Private AWS S3 bucket; presigned PUT (upload), presigned GET (download).
- **S3 key layout:**
  - Staging (at presigned upload, before document row exists):  
    `compliance/staging/{user_id}/{upload_uuid}/{safe_filename}.pdf`
  - Final layout (optional later, after document create):  
    `compliance/drivers/{driver_id}/{document_type}/{legal_document_id}/…`  
    `compliance/vehicles/{vehicle_id}/{document_type}/{legal_document_id}/…`
- **Model fields:** `file_key` (S3 object key), `file_name` (original display name).
- **Heroku env:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`

### Upload flow

1. Mobile → `POST /api/documents/presigned-upload/` `{ file_name, content_type, file_size? }`
2. API validates PDF + size → returns `{ upload_url, file_key, expires_in }`
3. Mobile → PUT file direct to S3
4. Mobile → `POST /drivers/{id}/documents/` or `/vehicles/{id}/documents/` with metadata + `file_key` + `file_name`
5. Admin → presigned download (Phase 4A #4.3 view) → verify

### File types — PDF only (v1)

| Format | MVP |
|--------|-----|
| **PDF** | **Yes** — primary format for insurance, registration, license scans |
| **JPEG/PNG** | Deferred — optional later for phone photos |
| **DOCX / DOC** | **No** — easily edited; weak audit trail |

**Tampering:** PDF-only reduces casual editing but does **not** prove authenticity. Controls: admin human review, expiry dates, optional SHA-256 hash later. Driver copy: confirm policy covers **commercial delivery use**.

**Limits:** `application/pdf` only; `.pdf` extension; max **10 MB** per file; one file per document row (replace while `PENDING`).

### Implementation order (GitHub issues)

| # | Task | Repo | Status |
|---|------|------|--------|
| 4.1 | S3 bucket + IAM + Heroku env | Ops | **Done** — smoke test 6/6 on Heroku |
| 4.2 | `get_presigned_upload_url` + `get_presigned_download_url` in `compliance_service.py` | Backend | **Done June 3, 2026** — `compliance_storage.py`, PDF-only, staging keys |
| 4.3 | Wire presigned + download on `LegalDocumentViewSet` | Backend | **Done June 3, 2026** — `GET /api/documents/{id}/download/` |
| 4.4 | Tests: PDF ok, DOCX rejected, size, permissions, file_key ownership | Backend | Partial (with 4.2) |
| 4.5 | `uploadComplianceFile()` + file picker in `ComplianceDocumentsPanel` | Mobile | **Done** — PDF picker; upload via `POST /documents/upload/` |
| 4.6 | Admin “View file” on document row | Mobile | **Done** — View file button when `file_key` set |
| 4.7 | Prod smoke: driver upload PDF → admin preview → verify | Both | **Done July 7, 2026** — tom thumb driver license E2E on Vercel/Heroku |

---

## July 7, 2026 — Phase 4A prod verification (compliance PDF + admin approve)

**Environments:** Vercel web + Heroku `truck-buddy` + S3 `truck-buddy-compliance-prod` (ca-central-1)

### Prod smoke (4.7) — PASS

| Step | Role | Result |
|------|------|--------|
| Upload driver license PDF | Driver (tom thumb) | Pass |
| Submit for review | Driver | Pass — status `PENDING` |
| View attached PDF | Admin | Pass |
| Approve document | Admin | Pass — status `VERIFIED`, no browser popup |
| S3 infrastructure | Ops | Pass — `test_s3_storage` 6/6 on Heroku |

### Fixes shipped during testing

| Issue | Fix | Commits |
|-------|-----|---------|
| `Failed to fetch` on PDF upload (browser → S3 CORS) | Backend proxy `POST /api/documents/upload/`; mobile FormData upload | Backend `e12e4f4`, Mobile `8b1da9f` |
| `InvalidRegionError` on Heroku | `AWS_S3_REGION_NAME=ca-central-1` (not console label); region normalizer | Backend `8a671ed` |
| S3 `head_bucket` 403 | IAM: `ListBucket` without prefix condition | Ops (IAM policy) |
| Admin Approve did nothing on web | `Alert.alert` multi-button broken on RN Web → direct Approve + inline success | Mobile `a6f6de9`, `a1a5fdf` |

### Upload flow (production)

1. Driver → **Choose PDF** → **Submit for review**
2. Mobile → `POST /api/documents/upload/` (multipart) → Heroku → S3 `compliance/staging/…`
3. Mobile → `POST /api/drivers/{id}/documents/` with metadata + `file_key`
4. Admin → **View file** → `GET /api/documents/{id}/download/` → presigned GET
5. Admin → **Approve** (immediate save, no confirmation dialog)

### Related docs

- `docs/PHASE_4A_LEGAL_COMPLIANCE.md` §5, §12
- `DeliveryAppBackend/docs/COMPLIANCE.md`
- `docs/PROJECT_PLAN.md` Phase 4A #4
