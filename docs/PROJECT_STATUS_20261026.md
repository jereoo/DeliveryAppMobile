# DeliveryApp / BuyNHaul — Project Status

**Date:** October 26, 2026  
**Report type:** Production email (Mailgun SMTP) — Phase 4D ops  
**Environments:** https://www.buynhaul.com · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Mailgun sending domain `mg.buynhaul.com`** | Done — SPF + DKIM + tracking **verified** (Mailgun) |
| **GoDaddy DNS (Mailgun connect)** | Done — sending/tracking records for `mg` |
| **Heroku `EMAIL_*` + SMTP backend** | Done — `smtp.mailgun.org`, SMTP user on `mg.buynhaul.com` |
| **`DEFAULT_FROM_EMAIL=compliance@buynhaul.com`** | Done — **prod verified** (inbox test) |
| **Sandbox SMTP path** | Done (Oct 25) — authorized recipient test before cutover |
| **`run_compliance_daily_jobs` dry-run / live on Heroku** | **Next** — SMTP ready; confirm job output + optional live send |
| **GitHub Actions nightly cron** | Done (code) — sends real mail when job runs and drivers match reminder rules |

---

## Prod verified (October 26, 2026)

### Mailgun + Heroku SMTP

| Check | Result |
|-------|--------|
| Mailgun domain `mg.buynhaul.com` sending DNS (SPF, DKIM) | Pass — verified |
| Mailgun tracking CNAME `email.mg.buynhaul.com` | Pass — verified |
| Heroku Run console `send_mail` → `engineering1@360software.ca` | Pass — returned `1` |
| Inbox **From** address | Pass — `compliance@buynhaul.com` |
| Mailgun receiving MX on `mg` | Not required for outbound — **unverified** (optional) |
| DMARC TXT on `_dmarc.mg` | Optional — unconfigured in Mailgun |

**Provider:** Mailgun (US). SendGrid not used (signup rejected).  
**Heroku app slug:** `truck-buddy` (internal; customer brand remains BuyNHaul / `buynhaul.com`).

**Reference:** [`docs/PRODUCTION_DOMAIN_AND_EMAIL.md`](PRODUCTION_DOMAIN_AND_EMAIL.md) · `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md`

---

## Recommended next (ops)

| Step | Action |
|------|--------|
| 1 | Heroku **Run console** (bash, not `manage.py shell`): `python manage.py run_compliance_daily_jobs --dry-run` |
| 2 | If dry-run looks correct: `python manage.py run_compliance_daily_jobs` (or wait for 06:00 UTC GitHub workflow) |
| 3 | Mailgun **Sending → Logs** after first scheduled/live reminder batch |
| 4 | Optional: `_dmarc.mg` + inbound MX only if receiving mail at `@mg.buynhaul.com` |

---

## Open / backlog

| Item | Status |
|------|--------|
| Phase 4G Slice 5 (staff audit log, invite-by-email) | Backlog |
| Custom Heroku domain `api.buynhaul.com` | Optional |
| In-app rebrand DeliveryApp → BuyNHaul | Optional |

---

*Prior reports: `PROJECT_STATUS_20260914.md` (custom domain + CORS)*
