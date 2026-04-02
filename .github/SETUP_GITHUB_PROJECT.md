# Connect this repo to GitHub & create the project plan there

## 1. Fix `origin` (important)

This folder’s Git may point to the **backend** repo by mistake. Check:

```bash
git remote -v
```

If `origin` is `jereoo/DeliveryAppBackend` but this folder is the **mobile app**, use the one-time split script:

1. Create an **empty** GitHub repository (e.g. `jereoo/DeliveryAppMobile`) — no README.
2. From the repo root:

```powershell
.\scripts\migrate-to-mobile-repo.ps1
# SSH:
# .\scripts\migrate-to-mobile-repo.ps1 -RepoUrl "git@github.com:jereoo/DeliveryAppMobile.git"
```

That pushes `master` → `main` on the new remote and renames your local branch to `main`.

---

## 2. Push the project plan

After committing `docs/PROJECT_PLAN.md` and this file:

```bash
git add docs/PROJECT_PLAN.md .github/SETUP_GITHUB_PROJECT.md
git commit -m "docs: add GitHub project plan and setup instructions"
git push origin HEAD
```

The plan then lives **on GitHub** with the rest of the code.

---

## 3. Create a GitHub Project (board)

1. Open **https://github.com/jereoo** (or your org) → **Projects** → **New project**.
2. Choose **Board** (or **Table** if you prefer).
3. Name it e.g. **DeliveryApp Roadmap**.
4. Add columns: **Backlog**, **In progress**, **Done** (or **Todo / Doing / Done**).

**Link the project to a repository (optional):**

- In the project → **Settings** (gear) → add repository **DeliveryAppMobile** (and/or backend).

---

## 4. Create issues from the plan

1. Open the repo → **Issues** → **New issue**.
2. For each Phase 1 row still **Todo**, create an issue with title like:  
   `[Phase 1] Remove runtime.txt in favor of .python-version`
3. Add label `phase-1` (create label once).
4. In the **Project** sidebar, add the issue to **DeliveryApp Roadmap** and set column **Backlog**.

Repeat for Phase 2/3 when you start them.

---

## 5. Slack (optional)

- Install **GitHub** app in Slack → subscribe to the repo → get PR/issue notifications in a channel.  
- Slack does **not** replace Issues; use it for alerts and chat only.

---

## 6. GitHub CLI (optional)

If you use [`gh`](https://cli.github.com/):

```bash
gh auth login
gh repo view
# Create project from UI, or explore: gh project --help
```

Project creation via `gh` is available for newer Projects; the web UI is the most reliable for small teams.
