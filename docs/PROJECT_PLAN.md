# DeliveryApp — Project Plan

**Last updated:** June 9, 2026  
**Team size:** 1–3  
**Overall status:** 🟢 Phase 1 **complete**; **driver self-service CRUD** shipped June 3, 2026  
**Tracking:** [GitHub Issues](https://github.com/jereoo/DeliveryAppBackend/issues) + [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) (see `.github/SETUP_GITHUB_PROJECT.md`).  
**Latest status report:** `DeliveryApp/project-docs/PROJECT_STATUS_20260603.md`

---

## Vision

Full-stack delivery management: Django API on Heroku, Expo web on Vercel, React Native for devices.

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

## Phase 2 — Data & workflow reliability *(not started)*

| Item | Status |
|------|--------|
| Seed / demo data strategy for staging/production | Todo |
| Clear API validation messages for duplicate registration fields | Todo |
| Logging for auth and registration failures | Todo |
| Optional: staging Heroku app | Todo |
| **Vehicle lifecycle (MVP):** soft inactive + staff reactivate; no hard delete when history exists | Done |
| Driver: deactivate own assigned vehicle (`POST /drivers/me/vehicle/deactivate/`) | Done |
| Staff: deactivate/reactivate any vehicle; hard DELETE only when zero `DriverVehicle` / `DeliveryAssignment` rows | Done |

**Vehicle status — ship now vs later**

| Status | Meaning | Ship in |
|--------|---------|---------|
| **Active** | In service; eligible for assignment and deliveries | **Now** (`Vehicle.active=True`, already on model) |
| **Inactive** | Temporarily off fleet (sold, repair, driver stepped down); row kept; **staff may reactivate** | **Now** (`Vehicle.active=False`) |
| **Disposed** | Permanently retired (scrapped/totaled); never reactivated; archive or delete when no FK history | **Future** — not same as inactive; defer to Phase 4 |

**Reactivation reverification (stub only in Phase 2):** When staff sets `active=True`, API accepts today with no extra checks. Add placeholder fields/docs for future gates: insurance valid, registration valid, inspection date (see Phase 4).

---

## Phase 3 — CI/CD & release safety *(partial)*

| Item | Status |
|------|--------|
| CI: backend tests + frontend build on PR (`phase1-ci.yml`) | Partial — workflows exist; tests use `continue-on-error` |
| Branch strategy: `main` = production deploys | Done |
| Document rollback (Heroku releases, Vercel deployments) | Todo |
| Align mobile CI `EXPO_PUBLIC_BACKEND_URL` with `truck-buddy` Heroku app | Done |

---

## Phase 4 — Product (from roadmap) *(not started)*

- Large-item domain (dimensions, capacity matching, estimates) — see workspace `project-docs/AUTOMATED_BUILD_PLAN.md`
- Payments (Stripe), notifications, EAS / store prep
- **Vehicle `disposed` status** — third lifecycle state (distinct from inactive); staff-only; archive row or cascade delete when no related records; drivers cannot dispose (only inactive)
- **Vehicle legal / compliance** — insurance, registration, inspection docs; upload/storage; expiry tracking
- **Reactivation reverification workflow** — before `inactive → active`, require staff confirmation that insurance + registration (and later inspection) are current; block assignment until verified

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

See `.github/SETUP_GITHUB_PROJECT.md` for step-by-step clicks.
