# DeliveryApp — Architecture

**Last updated:** June 12, 2026  
**Product focus:** **v1.0** — single fleet, single-driver context  
**Cursor rules:** `.cursor/rules/layered-architecture.mdc`  
**Latest prod QA:** `docs/PROJECT_STATUS_20260612.md` — admin + driver vehicle CRUD pass

---

## Vision

Layered architecture with **one source of truth** per CRUD operation, **role-based access control (RBAC)**, and **no duplicated Admin/Driver business logic**. Follow **SOLID** and **DRY**.

---

## Layered architecture rules

### Backend (Django REST Framework)

| Layer | Responsibility |
|-------|----------------|
| **ViewSets** | HTTP only — parse request, call service, return response |
| **Permission classes** | Authorization / RBAC (who can act on which resource) |
| **Services** | Business rules, workflows, shared create/update/delete |
| **Serializers** | Input/output shape and field-level validation |
| **Models** | Data structure and simple model behavior only |

**Rules:**

- ViewSets handle HTTP requests and responses only.
- Business logic belongs in **Services** (e.g. `delivery/vehicle_update.py`).
- Authorization should preferably use **DRF Permission classes**.
- Temporary authorization helpers in services are acceptable during refactoring; migrate to permissions incrementally.
- Models remain thin.
- Use a **single source of truth** for CRUD operations.
- Avoid duplicate Admin/Driver business logic.

**Example (vehicle update):**

- Service: `update_vehicle(user, vehicle, data)` — shared validation and save.
- Staff uses `VehicleSerializer`; driver uses `DriverOwnedVehicleSerializer`.
- Endpoints: `PATCH /api/vehicles/{id}/` (primary); `PATCH /api/drivers/me/vehicle/` (convenience alias).
- **Prod verified:** backend `6b74039`, mobile `93d6d1a` (June 12, 2026).

### Frontend (React Native / Expo)

| Layer | Responsibility |
|-------|----------------|
| **Components / screens** | UI, local UI state, event handlers |
| **Services** (`src/services/`) | API calls, payload builders, error parsing, shared validation |
| **Config** (`src/config/`) | URLs and environment only |

**Rules:**

- Components handle UI and API calls only — **no business logic in components**.
- Admin and Driver flows that hit the same API use the **same service function** (e.g. `updateVehicleById` in `vehicleService.ts`).

---

## v1.0 product scope (current)

**Context:** Single global fleet. Admin implicitly acts as dispatcher for assignments.

| Role | Identity | Access |
|------|----------|--------|
| **Admin** | `User.is_staff` | Full system management |
| **Driver** | `Driver` profile + vehicle assignment | Own profile, assigned vehicle, assigned deliveries |
| **Customer** | `Customer` profile | Own profile, request deliveries, own history |

**Frontend:** `userType` = `admin | driver | customer` only.

### v1.0 feature gate

Before building a feature, ask:

> Does this assume **multiple organizations** or a **dispatcher who is not admin**?

- **Yes** → backlog for v2.0.
- **No** → implement with service + permission class + thin ViewSet/component.

### Do NOT build in v1.0

- `Organization` / `OrganizationMembership` models
- `organization_id` on tenant-scoped tables
- Dispatcher role, screens, or API endpoints
- Multi-tenant queryset mixins or org-scoped `/api/me/`

---

## v2.0 / Phase 5 — commercial fleet (deferred)

**When:** Commercial multi-driver / multi-tenant fleet (target ~v2.0).

**Then create (in order):**

1. `Organization` + `OrganizationMembership` (user, org, role)
2. DRF permission classes with org scope (`IsOrgMember`, `HasOrgRole`, object-level rules)
3. Org-scoped queryset mixin on ViewSets
4. `GET /api/me/` — roles, org, permissions for frontend routing
5. Extend existing **services** — do not fork Admin vs Dispatcher code paths

Design v1.0 services so org scope can be added later **without rewriting business logic**.

---

## Authorization migration path (v1.0)

| Stage | Approach | Status |
|-------|----------|--------|
| 1 | `is_staff` + inline checks in ViewSets | Legacy — being replaced incrementally |
| 2 | Shared service helpers (e.g. `user_can_update_vehicle`) | **Current** — vehicle updates |
| 3 | DRF permission classes per resource | **Next** — e.g. `CanUpdateVehicle` |
| 4 | Org-scoped permissions | **v2.0 only** |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| `docs/PROJECT_PLAN.md` | Phase roadmap |
| `docs/DEVELOPMENT_PROCESS.md` | Plan → build → test → done (DoR/DoD) |
| `docs/PHASE_4A_LEGAL_COMPLIANCE.md` | Driver/vehicle legal docs — full Phase 4A plan |
| `docs/PROJECT_STATUS_20260612.md` | Latest prod QA |
| `DeliveryAppBackend/docs/ROLLBACK.md` | Heroku rollback |

---

## Production URLs

| Service | URL |
|---------|-----|
| API (Heroku) | https://truck-buddy-f14f250ae8b3.herokuapp.com/ |
| Web (Vercel) | https://deliveryapp-mobile.vercel.app/ |
