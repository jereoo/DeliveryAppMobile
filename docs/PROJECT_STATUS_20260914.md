# DeliveryApp / BuyNHaul — Project Status

**Date:** September 14, 2026  
**Report type:** Production custom domain + CORS; email ops backlog  
**Environments:** https://www.buynhaul.com · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Domain selection — BuyNHaul.com** | Done |
| **Vercel custom domain (www + apex redirect)** | Done — Valid Configuration |
| **GoDaddy DNS → Vercel** | Done |
| **Heroku `CORS_ORIGINS` for BuyNHaul** | Done — login prod verified |
| **Compliance expiry email (SMTP)** | **Done** — see `PROJECT_STATUS_20261026.md` (Mailgun) |

---

## Prod verified (September 14, 2026)

### BuyNHaul web + API

| Check | Result |
|-------|--------|
| `https://www.buynhaul.com` loads DeliveryApp | Pass |
| `https://buynhaul.com` redirects to www | Pass (308 via Vercel) |
| Login from BuyNHaul origin | Pass (after `CORS_ORIGINS` update) |
| API URL unchanged | `https://truck-buddy-f14f250ae8b3.herokuapp.com/api` |

**Reference:** [`docs/PRODUCTION_DOMAIN_AND_EMAIL.md`](PRODUCTION_DOMAIN_AND_EMAIL.md)

---

## Email — Todo (Phase 4D ops)

| Step | Status |
|------|--------|
| SendGrid (or Mailgun) account | Todo |
| SPF + DKIM on GoDaddy for `buynhaul.com` | Todo |
| Heroku `EMAIL_*` + `DEFAULT_FROM_EMAIL=compliance@buynhaul.com` | Todo |
| Test `run_compliance_daily_jobs` (dry-run then live) | Todo |

Backend guide: `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md`

---

## Open / next focus

| Item | Status |
|------|--------|
| Email reminders live on Heroku | Todo |
| Phase 4G Slice 5 (staff audit log, invite-by-email) | Backlog |
| UI rebrand to BuyNHaul | Optional |

---

*Prior reports: `PROJECT_STATUS_20260813.md` (Phase 4G staff RBAC)*
