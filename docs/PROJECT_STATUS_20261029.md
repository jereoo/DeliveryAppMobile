# DeliveryApp / BuyNHaul — Project Status

**Date:** October 29, 2026  
**Report type:** Phase 4D compliance nightly jobs — prod verification  
**Environments:** https://www.buynhaul.com · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Phase 4D (compliance ops + expiry email)** | **Done** — code, cron, SMTP, and Heroku job runs verified |
| **`run_compliance_daily_jobs --dry-run`** | **Prod verified** — Oct 29, 2026 (0 expire / 0 reminders; no matching data) |
| **`run_compliance_daily_jobs` (live)** | **Prod verified** — Oct 29, 2026 (0 expired marked / 0 sent; job completed without error) |
| **Mailgun + `compliance@buynhaul.com`** | Done — see `PROJECT_STATUS_20261026.md` |
| **GitHub Actions nightly cron** | Done — continues at 06:00 UTC when docs hit expiry windows |

**Note:** Zero counts are **expected** when no `VERIFIED` documents have `expiry_date` on today, today+14, or today+30, and none are overdue. Real driver reminders will appear automatically when prod data matches those rules.

---

## Prod verified (October 29, 2026)

Heroku **Run console** (bash):

```text
Dry run: 0 document(s) would be marked EXPIRED.
Dry run: would send 0 (30-day), 0 (14-day), 0 (expiry-day) reminder(s) as of 2026-10-29.

Marked 0 document(s) as EXPIRED as of 2026-10-29.
Sent 0 (30-day), 0 (14-day), 0 (expiry-day) reminder(s) as of 2026-10-29.
```

---

## Current focus

| Item | Status |
|------|--------|
| **Phase 4G Slice 5** — staff audit log, invite-by-email | **Next** (backlog) |
| Monitor Mailgun logs when first non-zero reminder batch runs | Ongoing |
| Optional: `_dmarc.mg`, inbound MX on `mg` | Optional |

---

## References

- [`docs/PRODUCTION_DOMAIN_AND_EMAIL.md`](PRODUCTION_DOMAIN_AND_EMAIL.md)
- `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md`

---

*Prior reports: `PROJECT_STATUS_20261026.md` (Mailgun SMTP)*
