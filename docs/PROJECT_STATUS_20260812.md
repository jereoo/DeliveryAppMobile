# DeliveryApp — Project Status

**Date:** August 12, 2026  
**Report type:** Prod retest — admin list search/filters + admin Add Delivery (Phase 4H post-deploy)  
**Environments:** Vercel `deliveryapp-mobile.vercel.app` · Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Admin list filter parity (all screens)** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Admin list text search** | 🟢 **Done** — prod verified Aug 12, 2026 |
| **Admin Add Delivery (Aug 5 fixes)** | 🟢 **Done** — prod verified Aug 12, 2026 (UI + API) |
| **Phase 4H post-deploy table (items 1–4)** | 🟢 **Done** — prod verified Aug 12, 2026 |

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
| Driver My Vehicle replace flow | 🟡 Todo — prod QA |
| Compliance upload after vehicle replace | 🟡 Todo — prod QA |
| JWT auto-refresh on 401 (long sessions) | Backlog — UX improvement |
| Heroku `EMAIL_*` SMTP config | Blocked — final domain |
| Phase 4G staff RBAC | Backlog |

---

*Prior reports: `PROJECT_STATUS_20260811.md` (admin list ship) · `PROJECT_STATUS_20260805.md` (Phase 4H fixes)*
