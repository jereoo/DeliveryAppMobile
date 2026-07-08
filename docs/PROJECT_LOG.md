# DeliveryApp — Project Log

Chronological decisions and implementation notes. Latest status reports: `PROJECT_STATUS_*.md`.

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
