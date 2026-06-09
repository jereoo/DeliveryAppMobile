# Populate GitHub Project "DeliveryAppMobilePlan" from docs/PROJECT_PLAN.md
# Prerequisites: gh auth login (project + repo scopes)
# Usage: .\scripts\populate-github-project.ps1
#        .\scripts\populate-github-project.ps1 -ProjectName "DeliveryAppMobilePlan" -DryRun

param(
    [string]$Owner = "jereoo",
    [string]$ProjectName = "DeliveryAppMobilePlan",
    [string]$MobileRepo = "jereoo/DeliveryAppMobile",
    [string]$BackendRepo = "jereoo/DeliveryAppBackend",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$PlanUrl = "https://github.com/$MobileRepo/blob/main/docs/PROJECT_PLAN.md"

function Invoke-Gh {
    param([string[]]$GhArgs)
    if ($DryRun) {
        Write-Host "[dry-run] gh $($GhArgs -join ' ')" -ForegroundColor DarkGray
        return $null
    }
    $out = & gh @GhArgs 2>&1
    if ($LASTEXITCODE -ne 0) { throw "gh $($GhArgs -join ' ') failed: $out" }
    return $out
}

function Ensure-Label {
    param([string]$Repo, [string]$Name, [string]$Color, [string]$Description)
    if ($DryRun) { return }
    $labelsJson = gh label list --repo $Repo --json name 2>$null
    $existing = ($labelsJson | ConvertFrom-Json | Where-Object { $_.name -eq $Name }).name
    if (-not $existing) {
        Invoke-Gh @("label", "create", $Name, "--repo", $Repo, "--color", $Color, "--description", $Description) | Out-Null
        Write-Host "  label $Name on $Repo"
    }
}

function New-PlanIssue {
    param(
        [string]$Repo,
        [string]$Title,
        [string]$Body,
        [string[]]$Labels,
        [string]$Status
    )
    if ($DryRun) {
        Write-Host "  issue [$Status] $Title -> $Repo" -ForegroundColor Cyan
        return @{ url = "https://github.com/$Repo/issues/0"; status = $Status }
    }

    $createArgs = @("issue", "create", "--repo", $Repo, "--title", $Title, "--body", $Body)
    foreach ($l in $Labels) { $createArgs += @("--label", $l) }

    $url = (Invoke-Gh $createArgs | Out-String).Trim()
    Write-Host "  created $url"
    return @{ url = $url; status = $Status }
}

Write-Host "Checking gh auth..."
if (-not $DryRun) {
    gh auth status | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Run: gh auth login" }

    $scopes = (gh auth status 2>&1 | Out-String)
    if ($scopes -notmatch "read:project" -and $scopes -notmatch "'project'" -and $scopes -notmatch "\bproject\b") {
        throw @"
GitHub token is missing Projects scope.
Run this once, approve in the browser, then re-run this script:

  gh auth refresh -h github.com -s read:project,project
"@
    }
}

Write-Host "Finding project '$ProjectName' for $Owner..."
$projectListOut = gh project list --owner $Owner --format json --limit 50 2>&1
if ($LASTEXITCODE -ne 0) {
    $msg = ($projectListOut | Out-String).Trim()
    if ($msg -match "missing required scopes") {
        throw @"
$msg

Run: gh auth refresh -h github.com -s read:project,project
Then re-run: .\scripts\populate-github-project.ps1
"@
    }
    throw "gh project list failed: $msg"
}
$projectsPayload = $projectListOut | ConvertFrom-Json
$projectList = if ($projectsPayload.projects) { $projectsPayload.projects } else { @($projectsPayload) }
$match = $projectList | Where-Object { $_.title -eq $ProjectName } | Select-Object -First 1
if (-not $match -and -not $DryRun) {
    $names = ($projectList | ForEach-Object { $_.title }) -join ", "
    throw "Project '$ProjectName' not found under $Owner. Existing projects: $names. Create it at https://github.com/users/$Owner/projects"
}
$projectNumber = if ($DryRun) { 1 } else { $match.number }
Write-Host "Project number: $projectNumber"

Write-Host "Ensuring labels..."
foreach ($repo in @($MobileRepo, $BackendRepo)) {
    Ensure-Label $repo "phase-1" "0E8A16" "Phase 1 - MVP stabilization"
    Ensure-Label $repo "phase-2" "1D76DB" "Phase 2 - Data and workflow reliability"
    Ensure-Label $repo "phase-3" "5319E7" "Phase 3 - CI/CD and release safety"
    Ensure-Label $repo "phase-4" "B60205" "Phase 4 - Product roadmap"
    Ensure-Label $repo "qa" "FBCA04" "QA / verification"
}

$items = @(
    @{ Repo = $BackendRepo; Title = "[Phase 1] Backend on Heroku (truck-buddy), Postgres, migrations"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 1.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 1] Frontend on Vercel, API URL to Heroku"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 2.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] CORS + env (CORS_ORIGINS, EXPO_PUBLIC / app.config.js)"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 3.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Dependencies: googlemaps, usaddress, pycountry"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 4.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Admin bootstrap (ensure_admin) for first login"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 5.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Driver registration payload (vehicle_year, etc.)"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 6.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Remove runtime.txt; rely on .python-version only"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 7.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 1] Confirm Vercel Git integration to DeliveryAppMobile repo"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 8.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Rotate default admin password + document process"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 9. See docs/ADMIN_BOOTSTRAP.md.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 1] Production smoke test checklist (login, register, CRUD)"; Labels = @("phase-1"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 1 row 10.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 1] Driver self-service CRUD (profile + vehicle)"; Labels = @("phase-1"); Status = "Done"; Body = "Shipped June 3, 2026. Endpoints: GET/PATCH /api/drivers/me/ and /api/drivers/me/vehicle/.`n`nPlan: $PlanUrl" }

    @{ Repo = $MobileRepo; Title = "[QA] Retest admin vehicle Update after fix 6b30a2c"; Labels = @("qa", "phase-1"); Status = "Backlog"; Body = "Admin Manage Vehicles Update did not save (duplicate /api prefix). Fixed in commit 6b30a2c; verify on Vercel prod.`n`nPlan: $PlanUrl" }

    @{ Repo = $BackendRepo; Title = "[Phase 2] Seed / demo data strategy for staging/production"; Labels = @("phase-2"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 2.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 2] Clear API validation messages for duplicate registration fields"; Labels = @("phase-2"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 2.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 2] Logging for auth and registration failures"; Labels = @("phase-2"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 2.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 2] Optional: staging Heroku app"; Labels = @("phase-2"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 2.`n`nPlan: $PlanUrl" }

    @{ Repo = $BackendRepo; Title = "[Phase 3] CI: fix backend tests; remove continue-on-error in phase1-ci.yml"; Labels = @("phase-3"); Status = "Backlog"; Body = "Partial - workflows exist; tests use continue-on-error. From PROJECT_PLAN.md Phase 3.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 3] CI: frontend build on PR (phase1-ci.yml)"; Labels = @("phase-3"); Status = "Done"; Body = "Workflow exists. From PROJECT_PLAN.md Phase 3.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 3] Branch strategy: main = production deploys"; Labels = @("phase-3"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 3.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 3] Document rollback (Heroku releases, Vercel deployments)"; Labels = @("phase-3"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 3.`n`nPlan: $PlanUrl" }
    @{ Repo = $MobileRepo; Title = "[Phase 3] Align mobile CI EXPO_PUBLIC_BACKEND_URL with truck-buddy Heroku app"; Labels = @("phase-3"); Status = "Done"; Body = "From PROJECT_PLAN.md Phase 3.`n`nPlan: $PlanUrl" }

    @{ Repo = $BackendRepo; Title = "[Phase 4] Large-item domain (dimensions, capacity matching, estimates)"; Labels = @("phase-4"); Status = "Backlog"; Body = "See workspace project-docs/AUTOMATED_BUILD_PLAN.md.`n`nPlan: $PlanUrl" }
    @{ Repo = $BackendRepo; Title = "[Phase 4] Payments (Stripe), notifications, EAS / store prep"; Labels = @("phase-4"); Status = "Backlog"; Body = "From PROJECT_PLAN.md Phase 4.`n`nPlan: $PlanUrl" }
)

Write-Host "Creating issues and adding to project..."
$created = @()
foreach ($item in $items) {
    $result = New-PlanIssue -Repo $item.Repo -Title $item.Title -Body $item.Body -Labels $item.Labels -Status $item.Status
    if ($result) { $created += $result }
}

if (-not $DryRun -and $created.Count -gt 0) {
    Write-Host "Adding $($created.Count) items to project..."
    foreach ($entry in $created) {
        Invoke-Gh @("project", "item-add", $projectNumber, "--owner", $Owner, "--url", $entry.url) | Out-Null
    }

    Write-Host "Setting Status field where possible..."
    $projectMeta = gh project view $projectNumber --owner $Owner --format json | ConvertFrom-Json
    $projectNodeId = $projectMeta.id
    $fieldsJson = gh project field-list $projectNumber --owner $Owner --format json
    $fields = $fieldsJson | ConvertFrom-Json
    $statusField = $fields.fields | Where-Object { $_.name -eq "Status" }
    if ($statusField) {
        $doneId = ($statusField.options | Where-Object { $_.name -eq "Done" }).id
        $todoId = ($statusField.options | Where-Object { $_.name -match "Todo|Backlog" }).id
        if ($doneId -or $todoId) {
            $projectItems = (gh project item-list $projectNumber --owner $Owner --format json --limit 200 | ConvertFrom-Json).items
            foreach ($entry in $created) {
                $issueNum = if ($entry.url -match "/issues/(\d+)") { [int]$Matches[1] } else { continue }
                $pi = $projectItems | Where-Object { $_.content.number -eq $issueNum } | Select-Object -First 1
                if (-not $pi) { continue }
                $optionId = if ($entry.status -eq "Done") { $doneId } else { $todoId }
                if ($optionId) {
                    gh project item-edit --id $pi.id --project-id $projectNodeId --field-id $statusField.id --single-select-option-id $optionId 2>$null
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Done. Open project: https://github.com/users/$Owner/projects/$projectNumber" -ForegroundColor Green
Write-Host "Plan doc: $PlanUrl"
