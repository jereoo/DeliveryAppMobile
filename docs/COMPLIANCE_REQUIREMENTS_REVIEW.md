# Compliance requirements review (BC local delivery)

**Source:** `compliance full requirements.docx` (TruckBuddy / BC local courier context)  
**Reviewed:** July 16, 2026  
**Product scope:** v1.0 MVP — single local fleet, pickup trucks (vans optional), Admin + Driver + Customer  
**Out of scope:** Fleet logistics, dispatcher, multi-tenant (Phase 5 / v2.0)

---

## Document summary

The requirements describe **local delivery within BC** using drivers’ own **Class 5** vehicles (car/SUV/pickup). Legal bar is **lower than long-haul or cross-border trucking**. Core proof: **licence, registration, insurance** (+ optional municipal business licence, GST).

Recommended platform capabilities: **document registry**, **expiry tracking**, **admin approval**, **driver/admin dashboards**, **reminder notifications**, and optional **trust & safety** (background check, abstract) — not all required for MVP.

---

## Feature recommendations

### Already built (Phase 4A — keep)

| Requirement | Platform today | Verdict |
|---------------|----------------|---------|
| Driver licence upload + admin approve | `LegalDocument` + PDF + Approve | **Shipped** |
| Vehicle registration | Same | **Shipped** |
| Commercial / delivery insurance | `COMMERCIAL_INSURANCE` + coverage type | **Shipped** |
| Vehicle details (year, make, model, plate) | `Vehicle` model + Edit My Vehicle | **Shipped** |
| Phone, email | Driver phone + User email | **Shipped** |
| Driver compliance status tile | `ComplianceStatusCard` + API | **Shipped** |
| Admin pending approvals | Compliance panel on driver/vehicle | **Shipped** |
| PDF storage (S3) | Heroku → S3 | **Shipped** |

### MVP — build next (high value, aligns with doc + plan)

| Requirement | Recommendation | Plan phase |
|---------------|----------------|------------|
| **Expiry dates enforced** | **Good — required** | **4B** (nightly `EXPIRED`, block stale verified) |
| **Block dispatch when non-compliant** | **Good — required** for paid deliveries | **4C** |
| **Reactivate vehicle only if reg + insurance valid** | **Good** | **4B** |
| **Admin: drivers with expired docs** | **Good** — list/filter on admin dashboard | **4D** |
| **Admin: pending document queue** | **Good** — single “inbox” view | **4D** |
| **Expiry reminders (30 / 14 / day-of)** | **Good** — email first; SMS later | **4D** |
| **Vehicle colour** | **Good — small** — doc asks for it; useful for customer/driver ID | **4E** |
| **Emergency contact** | **Good for local ops** — name + phone on driver profile | **4E** |
| **ICBC / BC copy in UI** | **Good** — consent text mentions delivery use + ICBC | **4E** (docs + labels only) |

### MVP — nice to have (defer until core delivery loop is solid)

| Requirement | Recommendation | Plan phase |
|---------------|----------------|------------|
| Pre-shift vehicle checklist (tires, lights, brakes…) | **Optional** — good safety practice; not legally required for Class 5 local | **Backlog 4F** |
| Inspection document type | **Optional** — already in model; keep optional, no hard gate in BC MVP | Already optional |
| Business licence (municipal) | **Optional** — track as doc type later if needed | **Backlog** |
| GST number on driver profile | **Optional** — only if fleet handles contractor GST | **Backlog** |

### Post-MVP / v1.1+ (document says “good practice”, not MVP)

| Requirement | Recommendation | Verdict |
|---------------|----------------|---------|
| Selfie + licence match | **Defer** — needs ID vendor or manual review | Not MVP |
| Criminal record check | **Defer** — process outside app; optional upload later | Not MVP |
| Driver abstract (ICBC driving record) | **Defer** — manual upload + expiry date possible later | v1.1 |
| Proof of work eligibility | **Defer** | v1.1 |
| SIN for tax reporting | **Defer** — high privacy; only if building payroll/payouts | With **Payments** |
| Direct deposit / banking | **Defer** — payments module | **Phase 6** |
| Route tracking | **Defer** — doc lists as future | **Phase 6+** |
| Reporting & analytics dashboard | **Partial** — compliance counts first; full analytics later | **4D** then **6** |

### Not needed for this MVP (explicitly out of scope)

| Item | Verdict |
|------|---------|
| Multi-tenant fleet / dispatcher / logistics | **Phase 5 / v2.0 — not MVP** |
| Formal CVSE/commercial trucking compliance | **Not needed** — Class 5 local pickup |
| Cross-border / long-haul rules | **Not needed** |
| Cryptographic / automated insurance verification | **Not needed** — admin review is enough for MVP |

---

## Module map (from requirements doc → plan)

| Doc module | MVP status | Notes |
|------------|------------|-------|
| Driver Management | **Partial** | CRUD + vehicle assign + compliance |
| Customer Management | **Done** | CRUD + deliveries |
| Delivery Orders | **Done** | Request + assign |
| Dispatch Board | **Partial** | Admin assignments; no map board |
| Document & Compliance | **4A done; 4B–4D todo** | |
| Payments & Invoicing | **Missing** | Phase 6 |
| Route Tracking | **Missing** | Post-MVP |
| Reporting & Analytics | **Minimal** | Phase 4D + 6 |

---

## BC-specific notes

- **Class 5 licence** — record class in notes or future `license_class` field; no CDL logic for MVP.
- **ICBC insurance** — treat as `COMMERCIAL` or `OTHER` with driver consent that policy covers **delivery use**; do not auto-verify with ICBC.
- **Personal vs commercial** — platform already flags `COMMERCIAL` coverage type; Phase 4C should block dispatch if insurance is `PERSONAL` only.

---

## Related docs

- `docs/PROJECT_PLAN.md` — updated July 16, 2026 with Phases 4B–4F, 6
- `DeliveryAppBackend/docs/COMPLIANCE.md`
- `docs/PHASE_4A_LEGAL_COMPLIANCE.md`
