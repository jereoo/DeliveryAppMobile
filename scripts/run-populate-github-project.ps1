# Ensures GitHub CLI is on PATH, refreshes project scopes, populates DeliveryAppMobilePlan.
# Usage: .\scripts\run-populate-github-project.ps1

$ErrorActionPreference = "Stop"
$GhDir = "C:\Program Files\GitHub CLI"
if (Test-Path "$GhDir\gh.exe") {
    $env:Path = "$GhDir;" + $env:Path
} elseif (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI not found. Install: winget install GitHub.cli"
}

Set-Location $PSScriptRoot\..

Write-Host "=== gh auth status ===" -ForegroundColor Cyan
$status = gh auth status 2>&1 | Out-String
Write-Host $status

if ($status -match "not logged in") {
    Write-Host "Logging in with repo + project scopes..." -ForegroundColor Yellow
    gh auth login -h github.com -p https -w -s repo,read:project,project
} elseif ($status -notmatch "read:project" -or $status -notmatch "\bproject\b") {
    Write-Host "Refreshing token with project scopes..." -ForegroundColor Yellow
    gh auth refresh -h github.com -s read:project,project
}

Write-Host "`n=== gh project list ===" -ForegroundColor Cyan
gh project list --owner jereoo

Write-Host "`n=== populate project ===" -ForegroundColor Cyan
& "$PSScriptRoot\populate-github-project.ps1"
