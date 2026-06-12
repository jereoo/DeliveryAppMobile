# CI/CD — DeliveryAppMobile

**Last updated:** June 3, 2026  
**Canonical workflow:** `.github/workflows/phase1-ci.yml`  
**Production:** Vercel `deliveryapp-mobile` (auto-deploy from `main`)

---

## What runs on push/PR to `main`

| Job | Steps | Gates merge |
|-----|-------|-------------|
| **test** | `npm ci` → `npm run test:ci` (Jest) | Yes |
| **build-web** | `npx expo export -p web` → verify `dist/` | Yes |

`EXPO_PUBLIC_BACKEND_URL` is set to production Heroku API for build consistency.

Run locally:

```powershell
cd DeliveryAppMobile
npm ci --legacy-peer-deps
npm run test:ci
npx expo export -p web
```

---

## Other workflows

| File | Purpose |
|------|---------|
| `check-hardcoded-ips.yml` | Blocks PRs with hardcoded LAN IPs in source |

---

## Retired workflows

| File | Reason |
|------|--------|
| `cio-zero-tolerance.yml` | Legacy monorepo layout (`DeliveryAppMobile/` subfolder); replaced by `phase1-ci.yml` |

---

## Branch strategy

- **`main`** → production (Vercel auto-deploy)
- PRs must pass **Phase 1 Frontend CI** before merge

---

## Rollback

See `DeliveryAppBackend/docs/ROLLBACK.md` (coordinated API + web rollback).

---

## Related

| Repo | Workflow |
|------|----------|
| DeliveryAppBackend | `.github/workflows/phase1-ci.yml` |
| Process | `docs/DEVELOPMENT_PROCESS.md` |
