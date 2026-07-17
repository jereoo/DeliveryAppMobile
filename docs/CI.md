# CI/CD — DeliveryAppMobile

**Last updated:** July 16, 2026  
**Canonical workflow:** `.github/workflows/phase1-ci.yml`  
**Deploy verify:** `.github/workflows/deploy-verify.yml`  
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

## Deploy verification (after CI on `main`)

Workflow **`Verify Vercel Deploy`** runs automatically after **Phase 1 Frontend CI** succeeds on a push to `main`. It:

1. Polls Vercel deployments until commit `github.sha` is **READY** (20 min timeout)
2. Smoke-tests `https://deliveryapp-mobile.vercel.app/` → 200
3. Sets GitHub commit status **`deploy/vercel-production`** (success or failure)
4. **Fails the workflow** if auto-deploy did not happen
5. Optionally posts to **`DEPLOY_NOTIFY_WEBHOOK_URL`**

### Required GitHub secrets

| Secret | How to get it |
|--------|----------------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/settings/tokens) |
| `VERCEL_PROJECT_ID` | Vercel → **deliveryapp-mobile** → Settings → General → **Project ID** |

### Optional GitHub secret

| Secret | Purpose |
|--------|---------|
| `DEPLOY_NOTIFY_WEBHOOK_URL` | Slack/Discord incoming webhook for success + failure messages |

### GitHub email notifications

Profile → **Notifications** → enable **Actions** (workflow failures) for email alerts when deploy verify fails.

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
