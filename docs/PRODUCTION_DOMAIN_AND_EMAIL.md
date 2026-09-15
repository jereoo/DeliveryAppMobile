# Production domain — BuyNHaul.com

**Last updated:** September 14, 2026  
**Status:** Custom domain **live** on Vercel; login **prod verified** after Heroku CORS update. **Email (SMTP) — Todo.**

---

## Domain selection (September 2026)

Purchased domains:

| Domain | Notes |
|--------|--------|
| **BuyNHaul.com** | **Primary brand / production web** — chosen for buy + local haul story |
| RuckTruk.com | Parked — optional redirect to BuyNHaul later |
| TrukNGO.COM | Parked |
| LorryBuddy.com | Parked — aligns with legacy “TruckBuddy” Heroku app name |

**Registrar:** GoDaddy (DNS managed there).  
**App hosting:** Vercel (no separate web hosting).  
**API hosting:** Heroku app `truck-buddy` (unchanged; custom API subdomain optional later).

---

## Production URLs

| Role | URL |
|------|-----|
| **Primary web app** | https://www.buynhaul.com |
| Apex redirect | https://buynhaul.com → **308** → https://www.buynhaul.com |
| Legacy Vercel URL | https://deliveryapp-mobile.vercel.app (still valid) |
| **API** | https://truck-buddy-f14f250ae8b3.herokuapp.com/api |

Mobile `vercel.json` still sets `EXPO_PUBLIC_BACKEND_URL` to the Heroku API URL (no API domain change required for v1).

---

## Vercel configuration

**Project:** DeliveryAppMobile (GitHub → auto deploy `main`).

| Domain | Vercel setting |
|--------|----------------|
| `www.buynhaul.com` | Connect to **Production** |
| `buynhaul.com` | **308 Permanent Redirect** → `www.buynhaul.com` |
| `deliveryapp-mobile.vercel.app` | Production (legacy) |

**DNS verification:** Both BuyNHaul domains show **Valid Configuration** in Vercel → Settings → Domains.

---

## GoDaddy DNS (buynhaul.com)

Records in use (September 2026):

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `www` | `7fc2113a78358263.vercel-dns-017.com` (use current value from Vercel **View DNS Records**) |
| **A** | `@` | `216.198.79.1` (use current apex IP from Vercel **View DNS Records** for `buynhaul.com`) |

Leave **NS**, **SOA**, and `_domainconnect` as GoDaddy defaults.

**Ops note:** If the apex shows a GoDaddy “website builder” placeholder, **unpublish** the GoDaddy Website/Airo site for this domain and remove **Domain Forwarding** so only the DNS records above apply. Test in **Incognito** after DNS changes.

---

## Heroku configuration (truck-buddy)

### CORS (required for browser login on custom domain)

Config var **`CORS_ORIGINS`** must include every web origin that calls the API:

```text
https://deliveryapp-mobile.vercel.app,https://www.buynhaul.com,https://buynhaul.com
```

**Prod verified:** September 14, 2026 — `demo.customer` login on `buynhaul.com` after CORS update.

Set in **Heroku Dashboard → truck-buddy → Settings → Config Vars** (or `heroku config:set` when CLI available).  
Backend reads this in `DeliveryAppBackend/settings.py` when `DEBUG=False`.

### API / database

No DNS change on Heroku for v1. Postgres and dynos unchanged.

---

## Email setup — **Todo**

Compliance expiry reminders are **implemented in code** but **not sending** until SMTP is configured. Without `EMAIL_*`, Django uses the **console** backend (Heroku logs only).

**Planned sender domain:** `buynhaul.com`  
**Suggested From address:** `compliance@buynhaul.com` (or `noreply@buynhaul.com`)

### Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Create **SendGrid** (or Mailgun / SES) account | Todo |
| 2 | Add **SPF + DKIM** DNS records on GoDaddy (provider-supplied) | Todo |
| 3 | Set Heroku config vars on `truck-buddy` | Todo |
| 4 | Dry-run then live `run_compliance_daily_jobs` | Todo |
| 5 | Optional: update GoDaddy **_dmarc** when production mail is stable | Todo |

**Heroku vars** (see `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md`):

```bash
heroku config:set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend -a truck-buddy
heroku config:set EMAIL_HOST=smtp.sendgrid.net -a truck-buddy
heroku config:set EMAIL_HOST_USER=apikey -a truck-buddy
heroku config:set EMAIL_HOST_PASSWORD=<SendGrid API key> -a truck-buddy
heroku config:set EMAIL_USE_TLS=True -a truck-buddy
heroku config:set DEFAULT_FROM_EMAIL=compliance@buynhaul.com -a truck-buddy
```

**What email does today (v1):** Driver compliance **expiry reminders** at 30 / 14 / 0 days (to the driver’s registered email). No registration welcome, doc-upload-to-admin, or customer notification emails yet.

---

## Related docs

- `docs/PROJECT_PLAN.md` — Phase 4D email row  
- `DeliveryAppBackend/docs/PHASE_4D_COMPLIANCE_OPS.md` — nightly jobs + SMTP  
- `DeliveryApp/project-docs/PRODUCTION_SMOKE_TEST.md` — smoke URLs  
- `DeliveryAppBackend/docs/ADMIN_BOOTSTRAP.md` — admin login (not the same as `DEFAULT_FROM_EMAIL`)

---

## Optional follow-ups

- Redirect `deliveryapp-mobile.vercel.app` → BuyNHaul in Vercel  
- Custom Heroku domain `api.buynhaul.com`  
- Rebrand in-app title from “DeliveryApp” to **BuyNHaul**  
- Parked domains → 301 to `https://www.buynhaul.com`
