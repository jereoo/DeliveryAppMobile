# DeliveryApp / BuyNHaul — Project Status

**Date:** November 3, 2026  
**Report type:** Phase 4G staff invite-by-email — prod verification (admin username + RBAC)  
**Environments:** https://www.buynhaul.com · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Staff invite-by-email** | **Done** — end-to-end on BuyNHaul prod |
| **Admin-assigned username + confirm password** | **Done** — backend `00cc1ea`, mobile `8e4e4b9`, migration `0014` |
| **Read Only staff role (UAT)** | **Prod verified** — permission-gated nav behaved as expected |
| **Mail from invite** | `compliance@buynhaul.com` · link `/?staff_invite=TOKEN` |

---

## Prod verified (November 3, 2026)

1. Super Admin sent **Invite staff by email** with company-chosen username.
2. Invitee received Mailgun email, opened link on **www.buynhaul.com**, set password (with confirmation), completed profile names.
3. Invitee logged in as **staff · Read Only**; dashboard and menus matched read-only permissions.

**Note:** Invites created before migration `0014` have no stored username — re-send invite after deploy.

---

## Deploy evidence

| Repo | Commits (invite polish) | Earlier Slice 5 + password auth |
|------|-------------------------|----------------------------------|
| DeliveryAppBackend | `00cc1ea` | `59ba53c` · `2a893b3` · `0012`–`0014` |
| DeliveryAppMobile | `8e4e4b9` | `c84a187` · `66d09ff` |

Heroku **release** migrate · Vercel CI/deploy passed.

---

## Current focus

See **`docs/PROJECT_PLAN.md`** — Phase 4G exit criteria met; next work is remaining 4G polish, 4E profile gaps, ops monitoring, and optional backlog items.

---

## References

- [`docs/PROJECT_LOG.md`](PROJECT_LOG.md)
- [`docs/PRODUCTION_DOMAIN_AND_EMAIL.md`](PRODUCTION_DOMAIN_AND_EMAIL.md)
- [`docs/PROJECT_STATUS_20261029.md`](PROJECT_STATUS_20261029.md)
