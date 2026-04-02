# DeliveryApp — Project Plan

**Last updated:** April 2026  
**Team size:** 1–3  
**Tracking:** Use [GitHub Issues](https://github.com/jereoo/DeliveryAppBackend/issues) + [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) (see `.github/SETUP_GITHUB_PROJECT.md`).

---

## Vision

Full-stack delivery management: Django API on Heroku, Expo web on Vercel, React Native for devices.

---

## Phase 1 — MVP stabilization *(~85–90% complete)*

| # | Task | Status | Owner |
|---|------|--------|--------|
| 1 | Backend on Heroku (`truck-buddy`), Postgres, migrations | Done | — |
| 2 | Frontend on Vercel, API URL → Heroku | Done | — |
| 3 | CORS + env (`CORS_ORIGINS`, `EXPO_PUBLIC` / `app.config.js`) | Done | — |
| 4 | Dependencies: `googlemaps`, `usaddress`, `pycountry` | Done | — |
| 5 | Admin bootstrap (`ensure_admin`) for first login | Done | — |
| 6 | Driver registration payload (`vehicle_year`, etc.) | Done | — |
| 7 | Remove deprecated `runtime.txt`; rely on `.python-version` only | Todo | |
| 8 | Confirm Vercel Git integration → **DeliveryAppMobile** repo (not backend monorepo) | Todo | |
| 9 | Rotate default `admin` password + document process | Todo | |
| 10 | Production smoke test checklist (login, register, CRUD) | Todo | |

**Exit criteria:** All Phase 1 rows Done; no critical bugs on prod URLs.

---

## Phase 2 — Data & workflow reliability *(target: weeks 2–3)*

- Seed / demo data strategy for staging/production
- Clear API validation messages for duplicate registration fields
- Logging for auth and registration failures
- Optional: staging Heroku app

---

## Phase 3 — CI/CD & release safety *(target: week 4+)*

- CI: backend tests + frontend build on PR
- Branch strategy: `main` = production deploys
- Document rollback (Heroku releases, Vercel deployments)

---

## Phase 4 — Product (from roadmap) *(later)*

- Large-item domain (dimensions, capacity matching, estimates) — see workspace `project-docs/AUTOMATED_BUILD_PLAN.md`
- Payments (Stripe), notifications, EAS / store prep

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
| `jereoo/DeliveryAppBackend` | Django API only — clone with `main` as default branch |
| `jereoo/DeliveryAppMobile` | Expo app — **create** this empty repo on GitHub, then run `scripts/migrate-to-mobile-repo.ps1` once |

Local folders: `C:\Users\360WEB\DeliveryAppBackend` tracks **backend** (`main`). `C:\Users\360WEB\DeliveryAppMobile` should track **mobile** (`main` after migration), not the monorepo.

---

## How to track work in GitHub

1. Create a **GitHub Project** (Board): *Projects → New project → Board*.
2. Add columns: **Backlog**, **In progress**, **Done**.
3. Create **Issues** from the Phase 1 table (one issue per row, or group small items).
4. Link PRs with `Fixes #issue` in the description.

See `.github/SETUP_GITHUB_PROJECT.md` for step-by-step clicks.
