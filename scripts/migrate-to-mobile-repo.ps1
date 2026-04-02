<#
.SYNOPSIS
  Pushes this clone to a dedicated GitHub repo (industry-style split from the monorepo).

.PREREQUISITES
  1. On github.com → New repository → name: DeliveryAppMobile (or your choice).
  2. Empty repo: NO README, NO .gitignore (avoid merge conflicts on first push).
  3. You have push access (HTTPS or SSH).

.USAGE
  .\scripts\migrate-to-mobile-repo.ps1
  .\scripts\migrate-to-mobile-repo.ps1 -RepoUrl "git@github.com:jereoo/DeliveryAppMobile.git"

.AFTER SUCCESS
  - Vercel: Project Settings → Git → connect the new repository (or import from new repo).
  - Optional: on the old monorepo, delete branch `master` once you no longer need history there.
#>
param(
    [string] $RepoUrl = "https://github.com/jereoo/DeliveryAppMobile.git"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$current = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not a git repository or no origin remote."
}

if ($current -match "DeliveryAppMobile\.git$" -and $current -notmatch "DeliveryAppBackend") {
    Write-Host "origin already points to a dedicated mobile repo: $current"
    exit 0
}

Write-Host "Current origin: $current"
Write-Host "Adding temporary remote 'mobile' -> $RepoUrl"
git remote remove mobile 2>$null
git remote add mobile $RepoUrl

Write-Host "Pushing master -> main on new remote..."
git push -u mobile master:main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Create an empty GitHub repo and retry, or fix auth. Remote 'mobile' is still configured."
    exit 1
}

Write-Host "Switching origin to the new repo and renaming local branch to main..."
git remote remove origin
git remote rename mobile origin
git branch -m master main
git branch --set-upstream-to=origin/main main

Write-Host "Done. origin -> $(git remote get-url origin), branch: main"
