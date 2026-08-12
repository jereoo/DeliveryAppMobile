# AI Session End Report — DeliveryApp / TruckBuddy

**Purpose:** Standard **closing format** for the agent (and a **human checklist** for you) at the end of every session.

**Agent:** Paste this structure filled in as your **last message** when work stops.  
**Human:** Use the checklist below to verify before commit/deploy.

---

## Agent report template (copy structure)

```markdown
## Session summary
- **Task:** [what was requested]
- **Mode:** [implement | review-only | prod-test | docs-only | debug]
- **Outcome:** [completed | partial | blocked | review-only]

## What changed
| Repo | Files / area | Summary |
|------|----------------|---------|
| Backend | | |
| Mobile | | |
| Docs | | |

## Tests
| Suite | Command | Before | After | Notes |
|-------|---------|--------|-------|-------|
| Backend | | | | |
| Mobile | | | | |
| Prod smoke | | n/a | | if run |

## PROJECT_PLAN alignment
| Plan item | Previous status | New status | Evidence |
|-----------|-----------------|------------|----------|
| | | Done / In testing / Todo / Blocked | commit, prod test, or reason |

## Definition of Done (DEVELOPMENT_PROCESS §4)
- [ ] Acceptance criteria met (list which)
- [ ] Layered architecture / DEVELOPMENT_STANDARDS followed
- [ ] Tests pass (or failure explained)
- [ ] No unrelated scope / no Phase 5 code
- [ ] Plan/doc updated if status changed
- [ ] **Not** committed (unless you asked) — ready for your review

## Blockers / risks
- [None] or list

## Recommended next session (one item only)
- **Task:** [single PROJECT_PLAN row or UC-xx]
- **Suggested mode:** [implement | prod-test | …]
- **Starter prompt hint:** [one line you can paste next time]
```

---

## Human review checklist (after agent reports)

Run this **before you commit or deploy**:

### 1. Diff review
- [ ] Changes match the **one task** from the session starter
- [ ] No surprise files (`.env`, credentials, unrelated refactors)
- [ ] Diff size feels reasonable for the task

### 2. Tests
- [ ] Agent reported test commands you trust (not skipped)
- [ ] If UI changed: `npm run test:ci` green (or you ran it)
- [ ] If API changed: relevant pytest subset green (see DEVELOPMENT_PROCESS §6)

### 3. Plan & docs
- [ ] `PROJECT_PLAN.md` status matches reality (not marked Done while still “In testing”)
- [ ] Blockers still blocked (e.g. email until domain exists)

### 4. Prod (when shipping)
- [ ] Deploy only if you **intended** to ship (`main` → Heroku/Vercel)
- [ ] Smoke: admin path and/or driver path per `DeliveryApp/project-docs/PRODUCTION_SMOKE_TEST.md`
- [ ] Update `PROJECT_STATUS_YYYYMMDD.md` after prod verify

### 5. Git
- [ ] You review diff in Cursor or `git diff`
- [ ] **You** commit (agent does not unless you asked)
- [ ] Push: if SSL error on Windows, try `git -c http.sslBackend=schannel push origin main`

---

## Status vocabulary (use consistently)

| Status | Meaning |
|--------|---------|
| **Done** | DoD met + prod verified if user-facing |
| **In testing** / **await prod retest** | Code merged or local; human QA not finished |
| **Todo** | Not started |
| **Blocked** | Waiting on external decision (domain, business rule, etc.) |
| **Backlog** | Deferred (e.g. Phase 4G, Phase 5) |

Do **not** use **Done** for blocked or in-testing work.

---

## Example (short)

```markdown
## Session summary
- **Task:** Prod-retest admin delivery create (Phase 4H)
- **Mode:** prod-test
- **Outcome:** partial — create works; filter search needs retest after deploy

## Tests
- Mobile test:ci — 45 passed (no code change this session)

## PROJECT_PLAN alignment
- Admin Add Delivery — In testing → still In testing (one edge case open)

## Recommended next session
- **Task:** Finish prod retest admin list search boxes
- **Mode:** prod-test
```
