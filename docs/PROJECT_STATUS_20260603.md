# Project Status — June 3, 2026

**Phases closed:** 2 (data/reliability), 3 (CI/CD)  
**Active track:** Phase 4A — legal/compliance (backend API shipped locally)

---

## Phase 2 close-out

| Item | Status |
|------|--------|
| `seed_demo_data` command + `delivery/seed_demo.py` | Done |
| `docs/SEED_DATA.md`, `docs/STAGING.md` | Done |
| Legacy `load_test_data.py` marked broken | Done |
| `tests/test_seed_demo_data.py` | Done — in CI critical suite |

---

## Phase 3 close-out

| Item | Status |
|------|--------|
| Remove unused `pytest` import from `tests/test_api.py` | Done — fixes `manage.py test` in CI |
| Add `test_compliance`, `test_seed_demo_data` to critical CI job | Done |
| Full suite runs without `continue-on-error` | Done |

**CI critical suite:** 92 tests pass locally (`manage.py test`).

---

## Phase 4A progress (backend)

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | `LegalDocument` model + migration `0004` | Done |
| 2 | `compliance_service.py` | Done |
| 3 | API: driver/vehicle documents, verify/reject, `me/compliance-status` | Done |
| 4 | Presigned S3 upload | Stub — metadata-only until bucket configured |
| 5 | `docs/COMPLIANCE.md` | Done |
| 9 | `tests/test_compliance.py` (model + service + API) | Done |

### New API endpoints

| Method | Path |
|--------|------|
| GET/POST | `/api/drivers/{id}/documents/` |
| GET/POST | `/api/vehicles/{id}/documents/` |
| GET/PATCH | `/api/documents/{id}/` |
| POST | `/api/documents/{id}/verify/` |
| POST | `/api/documents/{id}/reject/` |
| GET | `/api/drivers/me/compliance-status/` |
| POST | `/api/documents/presigned-upload/` (400 until S3) |

**No assignment or reactivation blocking** — Phase 4B/4C.

---

## Next steps

1. **Deploy backend** — run migration on Heroku `truck-buddy`
2. **Phase 4A #6** — `complianceService.ts` on mobile
3. **Phase 4A #7–8** — Admin documents tab + driver compliance tile
4. **Phase 4A #4** — Wire S3 presigned upload when bucket ready

---

## Production URLs (unchanged)

| Service | URL |
|---------|-----|
| API | https://truck-buddy-f14f250ae8b3.herokuapp.com/ |
| Web | https://deliveryapp-mobile.vercel.app/ |

**Last prod vehicle/driver CRUD retest:** June 12, 2026 — pass (pre-compliance deploy).
