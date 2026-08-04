# DeliveryApp — Project Status

**Date:** August 4, 2026  
**Report type:** Screen audit — form field parity across register/create/edit flows  
**Sources:** DeliveryAppMobile screens + DeliveryAppBackend serializers/models

---

## Executive summary

| Area | Status |
|------|--------|
| **Screen inventory & gap analysis** | 🟢 Complete — documented in `PROJECT_PLAN.md` Phase 4H |
| **Customer profile edit** | 🔴 Missing screen; backend `GET /customers/me/` only (no PATCH) |
| **Admin delivery customer fields** | 🔴 `customer_name` / `customer_address` not aligned with API |
| **Address block parity** | 🟡 Driver self-edit ✅; driver register/admin ❌; customer self-edit ❌ |
| **AddressAutocomplete** | 🔴 Built but unused on all screens |

---

## Screen audit findings

### Missing screens

| Screen | Impact |
|--------|--------|
| Customer profile edit | Customers cannot update address, phone, or preferred pickup after registration |
| Customer delivery cancel/edit | Request-only flow; no self-service cancel |

### Critical field mismatches (P0)

1. **Admin delivery create/edit** — form uses `customer_name` and `customer_address`, but `DeliverySerializer` exposes `customer_name` as read-only and has no `customer_address`. Admin should use **customer FK picker**.
2. **Customer self-service** — no profile edit screen; backend needs `PATCH /customers/me/`.

### Address block coverage

| Screen | Structured address |
|--------|:------------------:|
| Customer register | ✅ |
| Customer admin | ✅ |
| Customer self edit | ❌ |
| Driver register | ❌ |
| Driver self edit | ✅ |
| Driver admin | ❌ |
| Delivery locations | ❌ (free-text) |

### Delivery fields missing from all UI (backend supports)

- `same_dropoff_as_customer`
- `delivery_date` / `delivery_time`
- `special_instructions`
- `estimated_cost` (staff only)

### Cross-cutting inconsistencies

- **Phone validation:** 10-digit NA on admin/edit; raw input on public register
- **Vehicle entry:** catalog on driver paths; free-text make/model on admin vehicle create
- **Driver registration duplicate:** `RegisterAsDriverScreen` (active) vs orphaned `App.tsx` `driver_register`
- **Compliance:** `effective_date` on backend; not in upload UI (`notes` present)

---

## Planned work (Phase 4H)

See `docs/PROJECT_PLAN.md` → **Phase 4H — Form & screen field parity**.

| Priority | Top items |
|----------|-----------|
| **P0** | Customer profile edit + `PATCH /customers/me/`; admin delivery customer picker |
| **P1** | Address block on driver register/admin; delivery scheduling fields; wire `AddressAutocomplete`; phone validation on register |
| **P2** | Unify vehicle catalog for admin; fix admin driver create; compliance `effective_date`; customer delivery cancel |
| **P3** | Remove legacy driver register in `App.tsx`; extract shared form components |

---

## Open / unchanged from prior status

| Item | Status |
|------|--------|
| Driver My Vehicle replace flow | Todo — prod QA |
| Compliance upload after vehicle replace | Todo — prod QA |
| Heroku `EMAIL_*` SMTP config | Todo — blocked on final domain |
| Phase 4G staff RBAC | Backlog |

---

*Prior log: `PROJECT_STATUS_20260731.md`*
