# AI Session Starter — DeliveryApp / TruckBuddy

**Purpose:** Copy-paste (and fill in the brackets) at the **start** of a Cursor chat so the agent has context without a long custom prompt.

**Related:** [`DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md) · [`DEVELOPMENT_STANDARDS.md`](DEVELOPMENT_STANDARDS.md) · [`AI_SESSION_END_REPORT.md`](AI_SESSION_END_REPORT.md)

---

## Quick template (copy everything below the line)

```text
DeliveryApp / TruckBuddy — new session

READ FIRST (do not code until you've skimmed these):
- docs/PROJECT_PLAN.md — overall status + current focus
- docs/DEVELOPMENT_STANDARDS.md — CRUD/validation/API patterns
- docs/DEVELOPMENT_PROCESS.md — DoR/DoD + test commands (§6)
- If this task touches business flows: DeliveryApp/project-docs/USE_CASES.md (relevant UC-xx)
- If this task touches structure: DeliveryApp/project-docs/ARCHITECTURE.md

ENVIRONMENT (always assume):
- Primary DB: Heroku Postgres on app truck-buddy (not local delivery_app)
- Heroku ops: Dashboard → Run console (avoid local heroku CLI unless I say)
- API: https://truck-buddy-f14f250ae8b3.herokuapp.com/
- Web: https://deliveryapp-mobile.vercel.app/
- Workspace: DeliveryApp.code-workspace (docs + DeliveryAppBackend + DeliveryAppMobile)

THIS SESSION
- Task: [one PROJECT_PLAN row, UC-xx, or GitHub issue — be specific]
- Mode: [implement | review-only | prod-test | docs-only | debug]
- Repos: [backend | mobile | both | docs-only]
- Acceptance criteria (3–5 bullets):
  1. [ ]
  2. [ ]
  3. [ ]

BOUNDARIES
- v1.0 only — no Phase 5 / multi-tenant / Dispatcher / Organization models
- One task this session — minimal diff; no unrelated refactors
- Do NOT commit, push, or deploy unless I explicitly ask
- Do NOT mark plan items Done unless DoD in DEVELOPMENT_PROCESS §4 is met
- If blocked or ambiguous: STOP and ask — do not guess

WHEN FINISHED
- Reply using the format in docs/AI_SESSION_END_REPORT.md
```

---

## Field guide

| Field | Examples |
|-------|----------|
| **Task** | `Phase 4D — prod-retest admin list search`; `UC-13 resubmit rejected doc`; `Fix compliance upload after vehicle replace` |
| **Mode** | **implement** = write code · **review-only** = read/analyse, no edits · **prod-test** = verify on Heroku/Vercel · **docs-only** = markdown only |
| **Repos** | Compliance API change = **backend** · Admin screen = **mobile** · End-to-end feature = **both** |

---

## Shorter variant (continuing previous work)

```text
Continue DeliveryApp from PROJECT_PLAN.md current focus: [paste focus line from plan header].

Mode: [implement | prod-test | review-only]
Repos: [backend | mobile | both]

Same boundaries as AI_SESSION_STARTER.md (v1.0, one task, no commit unless I ask).
End with AI_SESSION_END_REPORT.md format.
```

---

## Blocked / do-not-start items (check plan before coding)

These are often **not** ready for implementation — confirm in `PROJECT_PLAN.md`:

| Topic | Typical status | Agent action |
|-------|----------------|--------------|
| Expiry email / SMTP | Blocked — no final domain | Do not configure SendGrid until human provides domain |
| Phase 4G staff RBAC | Backlog | Do not start without explicit session task |
| Phase 5 / commercial fleet | Deferred | Refuse; point to v2 rule |
| Items marked **In testing** / **await prod retest** | QA, not new build | Mode = prod-test or verify only unless task says implement fix |

---

## Optional: green baseline (non-trivial code changes)

Add to your starter when touching backend or mobile logic:

```text
Before changing code: run baseline tests and report pass count.
After changes: run same suite; report pass count and delta.
Backend: pytest subset from DEVELOPMENT_PROCESS §6
Mobile: npm run test:ci
```
