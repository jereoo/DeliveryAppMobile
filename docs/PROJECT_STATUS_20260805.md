# DeliveryApp — Project Status

**Date:** August 5, 2026  
**Report type:** Phase 4H post-deploy — admin Add Delivery + address autocomplete production fixes  
**Sources:** Prod QA on Vercel web (`deliveryapp-mobile.vercel.app`) + Heroku `truck-buddy`

---

## Executive summary

| Area | Status |
|------|--------|
| **Phase 4H implementation** | 🟢 Done — `4140587` (backend), `e413ab7` (mobile) |
| **Address autocomplete on Vercel** | 🟢 Fix deployed — `36751b7` — **await prod retest** |
| **Admin Add Delivery save** | 🟢 Fix deployed — `9f421dc` + `38a62cb` — **await prod retest** |
| **Customer picker / demo customers** | 🟢 UX fix + clarified — real Heroku data, not phantom rows |

---

## Issues found in production (Aug 5)

### 1. Chrome local-network permission popup + Failed to fetch

**Symptom:** While adding a delivery as admin, typing in pickup/dropoff triggered a browser popup (*“Access other apps and services on this device”*) and red **Failed to fetch**.

**Cause:** Phase 4H wired `AddressAutocomplete` into admin delivery forms. The validation service defaulted to `http://localhost:8000/api` because it read `BACKEND_URL` instead of `EXPO_PUBLIC_BACKEND_URL` / `getApiUrl()`. A public HTTPS site calling localhost triggers Chrome Local Network Access.

**Fix:** Mobile `36751b7` — `src/services/addressValidation.ts` uses shared `getApiUrl()`.

**Status:** ✅ Deployed to Vercel — **retest after hard refresh**

---

### 2. Admin delivery did not save

**Symptom:** Admin filled Add Delivery form (often with **Same pickup as customer address** on) and tapped Create; delivery missing from list.

**Causes (combined):**

| Layer | Problem |
|-------|---------|
| **Backend** | Staff `POST /deliveries/` rejected blank `pickup_location` / `dropoff_location` even when `same_pickup_as_customer` / `same_dropoff_as_customer` were true. Customer `request_delivery` already allowed blanks; admin path did not. |
| **Mobile** | `createDelivery` in `App.tsx` swallowed errors (no rethrow), so `AdminDeliveriesScreen` returned to list on failure. |

**Fixes:**

| Repo | Commit | Change |
|------|--------|--------|
| DeliveryAppBackend | `9f421dc` | `_validate_delivery_location_fields()` shared by admin + customer serializers; require `customer` on staff create |
| DeliveryAppMobile | `38a62cb` | Rethrow on CRUD failure; show API validation on form; improve `parseDeliveryApiError` |

**Status:** ✅ Deployed to Heroku + Vercel — **retest Add Delivery**

---

### 3. Customer list / “demo customers don’t exist”

**Symptom:** Customer picker showed names like **Demo Customer**, Mike Hernandez, Sophia Smith; user believed rows were invalid.

**Clarification:** List is loaded from `GET /api/customers/` on Heroku:

- **Demo Customer** — `demo.customer` from `seed_demo_data` (`DemoPass1234!`)
- Other names — bulk test customers from `create_test_data` (if that command was run on Heroku)

**UX fix:** Mobile `38a62cb` — replace stacked `Button` list with selectable `Pressable` rows (✓ + highlight) and helper text *“Tap a customer below to select them.”*

**Status:** ✅ Deployed — selection should be obvious on retest

---

## Prod retest checklist

| # | Step | Expected |
|---|------|----------|
| 1 | Hard-refresh Vercel web app | Latest bundle loaded |
| 2 | Admin → Add Delivery → tap **Demo Customer** (or any row) | Row highlights with ✓ |
| 3 | Enable **Same pickup as customer address** OR enter pickup manually | No localhost popup; no Failed to fetch |
| 4 | Enter dropoff or enable **Same dropoff as customer address** | — |
| 5 | Tap **Create** | Success → delivery in list; failure → stay on form with error text |

---

## Commits (this fix batch)

| Repo | Commit | Summary |
|------|--------|---------|
| DeliveryAppMobile | `36751b7` | Address validation uses production API URL on Vercel |
| DeliveryAppBackend | `9f421dc` | Admin delivery create with same-as-customer address flags |
| DeliveryAppMobile | `38a62cb` | Admin delivery error handling + customer picker UX |

---

## Open / unchanged

| Item | Status |
|------|--------|
| Admin Add Delivery prod retest | 🟡 Todo — after Vercel/Heroku deploy |
| **UX & design consistency pass** | 🟡 Ongoing standard — all screens should share look/feel and interaction patterns; see `PROJECT_PLAN.md` |
| Driver My Vehicle replace flow | Todo — prod QA |
| Compliance upload after vehicle replace | Todo — prod QA |
| Heroku `EMAIL_*` SMTP config | Todo — blocked on final domain |
| Phase 4G staff RBAC | Backlog |

---

## UX & design consistency (product standard)

**Requirement (Aug 5, 2026):** The whole app must have a **consistent look and feel**. All screens should follow the **same UX patterns** when possible or when it makes sense — layout, controls, errors, loading, and theme — not only matching backend fields.

**Documented in:**

- `DeliveryAppMobile/docs/PROJECT_PLAN.md` — pattern table + known gaps backlog
- `DeliveryAppMobile/docs/ARCHITECTURE.md` — frontend UX rules
- `DeliveryAppMobile/docs/DEVELOPMENT_PROCESS.md` — DoD checkbox for mobile UI changes

**Reference implementation:** Admin delivery customer picker (`38a62cb`) — selectable rows + theme, inline errors, stay on form on failure.

---

*Prior log: `PROJECT_STATUS_20260804.md` (Phase 4H screen audit)*
