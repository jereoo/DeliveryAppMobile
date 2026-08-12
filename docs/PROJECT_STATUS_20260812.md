# DeliveryApp — Project Status

**Date:** August 12, 2026  
**Report type:** Prod retest — admin list search/filters, Add Delivery, driver vehicle replace + compliance  
**Environments:** Vercel `deliveryapp-mobile.vercel.app` · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Admin list filter parity (all screens)** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Admin list text search** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Admin Add Delivery (Aug 5 fixes)** | 🟢 **Done** — prod verified Aug 12, 2026 (UI + API) |
| **Phase 4H post-deploy table (items 1–4)** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Driver My Vehicle replace + compliance after replace** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Dashboard logged-in username** | 🟢 **Done** — prod verified Aug 12, 2026 (`86801b5`, `847f82a`) |

---

## Prod verified (Aug 12, 2026)

### Admin list search + filters (Vercel)

Manual QA on all four primary admin list screens:

| Screen | Search | Filters + search | Sort |
|--------|--------|----------------|------|
| Customers | ✅ | ✅ | ✅ |
| Drivers | ✅ | ✅ | ✅ |
| Vehicles | ✅ | ✅ | ✅ |
| Deliveries | ✅ | ✅ | ✅ |

Also verified: **Showing X of Y**, clear filters, last-name picker A→Z (`3b43107`).

**Mobile commits:** `584fca4`, `ec30659`, `1f175df`, `3b43107` · **Deploy:** Vercel `main` @ `4b04410`

### Admin Add Delivery (Vercel + API)

| Check | Result |
|-------|--------|
| Customer picker (✓ + highlight) | ✅ |
| Same pickup / same dropoff as customer | ✅ |
| Create → delivery in list | ✅ |
| API `POST /api/deliveries/` with `same_*_as_customer` | ✅ |

**API evidence (Heroku prod):**

```text
POST /api/deliveries/ → id=35, customer=69 (demo.customer)
same_pickup_as_customer=True, same_dropoff_as_customer=True
pickup/dropoff resolved from customer address (999 Demo Street, Toronto…)
status=Pending, created_at=2026-08-12T04:13:58Z
```

**Fixes verified:** Mobile `36751b7`, `38a62cb` · Backend `9f421dc`

### Driver My Vehicle replace + compliance (Vercel + Heroku)

**Account:** `demo.driver` / `DemoPass1234!` · **New vehicle:** Chevrolet Silverado 1500 (plate VA458L)

| Step | Driver | Admin |
|------|--------|-------|
| Replace vehicle (catalog) | ✅ New vehicle identity saved | ✅ **Manage Vehicles** — new truck, resubmit/checklist, “No documents on file” |
| Before upload | ✅ Missing registration + insurance message | ✅ Inbox empty (no `LegalDocument` rows yet — **expected**) |
| Upload registration + insurance | ✅ Both **PENDING** | ✅ **Compliance inbox** — 2 rows (Demo Driver · VA458L) |
| Admin approve both docs | ✅ **VERIFIED** · “All required documents verified” | ✅ Inbox cleared for those rows |

**Design note:** Compliance **inbox** = uploaded docs awaiting review. Pre-upload gaps are visible on **Manage Vehicles** (reactivation checklist), not inbox.

**Mobile commits:** `5353a0b`–`680b00c` (+ `9174cd8`, `ddf0b7b` catalog/labels)

### Dashboard logged-in username (Vercel + Heroku)

| Check | Result |
|-------|--------|
| `GET /api/me/` returns `username` | ✅ |
| Welcome line shows username (e.g. `demo.driver`) | ✅ |
| Status box shows `Logged In (username)` | ✅ |

**Commits:** Mobile `86801b5` · Backend `847f82a`

### Admin auth note (non-blocking)

During a long QA session, **Add Delivery** failed with `Given token not valid for any token type` while list search still worked. **Cause:** list search is client-side on cached data; **POST** needs a live JWT. Access tokens expire after **15 minutes** and `makeAuthenticatedRequest` does not auto-refresh on 401. **Workaround:** logout → login. **Follow-up backlog:** token refresh on 401 in `App.tsx`.

---

## Tests (unchanged)

- Mobile `npm run test:ci` — **77 passed**
- Backend smoke script — **9/9 passed** (with `ADMIN_PASSWORD` + `ensure_admin` synced)

---

## Open / next focus

| Item | Status |
|------|--------|
| JWT auto-refresh on 401 (long sessions) | Backlog — UX improvement |
| Admin **Approve vehicle** after replaced truck docs verified | Optional — not retested this session |
| Heroku `EMAIL_*` SMTP config | Blocked — final domain |
| Phase 4G staff RBAC | Backlog |

---

*Prior reports: `PROJECT_STATUS_20260811.md` (admin list ship) · `PROJECT_STATUS_20260805.md` (Phase 4H fixes)*
