#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Update the pinned kairos-ontology-toolkit version.

.DESCRIPTION
    Reads the current pinned version from versions.lock, fetches the latest
    release from GitHub (or uses the supplied -Version), installs it, and
    writes the new version back to versions.lock.
    
    Never fetches @main or uses a floating version — the result is always a
    pinned release tag so builds remain reproducible.

.PARAMETER Version
    Specific version to pin (e.g. "1.2.0"). Omit to auto-detect the latest
    release from the GitHub releases API.

.PARAMETER Update
    Fetch the latest release (or the supplied -Version) and install it,
    then write the new version back to versions.lock.
    Without this flag the script only checks and reports.

.PARAMETER Check
    Only check whether a newer version is available and report it.
    Does not install anything or modify versions.lock.
    This is now the default behaviour when no flag is supplied.

.PARAMETER Yes
    Suppress the confirmation prompt and proceed automatically.

.EXAMPLE
    .\update-toolkit.ps1
    # Checks whether a newer release exists and reports it (no changes made)

.EXAMPLE
    .\update-toolkit.ps1 -Check
    # Same as the default — explicit form

.EXAMPLE
    .\update-toolkit.ps1 -Update
    # Fetches latest release, prompts for confirmation, installs and updates versions.lock

.EXAMPLE
    .\update-toolkit.ps1 -Update -Version 1.3.0
    # Pins to exactly v1.3.0 (no confirmation prompt)

.EXAMPLE
    .\update-toolkit.ps1 -Update -Yes
    # Fetches latest release and installs without prompting (useful in CI)
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$Version = "",

    [Parameter(Mandatory = $false)]
    [switch]$Update,

    [Parameter(Mandatory = $false)]
    [switch]$Check,

    [Parameter(Mandatory = $false)]
    [switch]$Yes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LOCK_FILE   = Join-Path $PSScriptRoot "versions.lock"
$REPO_BASE   = "https://api.github.com/repos/Cnext-eu/kairos-ontology-toolkit"
$REPO_GIT    = "https://github.com/Cnext-eu/kairos-ontology-toolkit.git"

function Write-Success { param([string]$msg) Write-Host "v $msg" -ForegroundColor Green }
function Write-Info    { param([string]$msg) Write-Host "i $msg" -ForegroundColor Cyan }
function Write-Warn    { param([string]$msg) Write-Host "! $msg" -ForegroundColor Yellow }
function Write-Err     { param([string]$msg) Write-Host "x $msg" -ForegroundColor Red }

# ── Read current pinned version from versions.lock ──────────────────────────
if (-not (Test-Path $LOCK_FILE)) {
    Write-Err "versions.lock not found at $LOCK_FILE"
    exit 1
}

$lockContent = Get-Content $LOCK_FILE -Raw
if ($lockContent -match '(?m)^TOOLKIT_VERSION=(.+)$') {
    $currentVersion = $matches[1].Trim()
    Write-Info "Current pinned version : $currentVersion"
} else {
    Write-Err "TOOLKIT_VERSION not found in versions.lock"
    exit 1
}

# ── Determine target version ─────────────────────────────────────────────────
if ($Version -eq "") {
    Write-Info "Fetching latest version from GitHub..."

    # Use gh CLI token if available (handles private repos)
    $headers = @{ "User-Agent" = "kairos-update-script" }
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        $ghToken = (gh auth token 2>$null) -replace '\s', ''
        if ($ghToken) { $headers["Authorization"] = "Bearer $ghToken" }
    }

    $latestTag = $null

    # 1) Try /releases/latest
    try {
        $rel = Invoke-RestMethod -Uri "$REPO_BASE/releases/latest" -Headers $headers
        $latestTag = $rel.tag_name -replace '^v', ''
        Write-Info "Found via releases : $latestTag"
    } catch {
        Write-Warn "No GitHub release found — falling back to git tags..."
    }

    # 2) Fall back to /tags
    if (-not $latestTag) {
        try {
            $tags = Invoke-RestMethod -Uri "$REPO_BASE/tags" -Headers $headers
            if ($tags -and $tags.Count -gt 0) {
                $latestTag = $tags[0].name -replace '^v', ''
                Write-Info "Found via tags : $latestTag"
            }
        } catch {}
    }

    if (-not $latestTag) {
        Write-Err "Could not auto-detect the latest version."
        Write-Err "The repo may have no releases or tags yet, or requires authentication."
        Write-Warn "Run with an explicit version:  .\update-toolkit.ps1 -Version <version>"
        exit 1
    }

    $targetVersion = $latestTag
} else {
    $targetVersion = $Version -replace '^v', ''
    Write-Info "Requested version : $targetVersion"
}

if ($targetVersion -eq $currentVersion) {
    Write-Success "Already at $currentVersion — nothing to do."
    exit 0
}

# ── Newer version found — report ────────────────────────────────────────────────
Write-Warn "New version available : $targetVersion  (current: $currentVersion)"

# Default (no -Update) and explicit -Check both exit here after reporting.
if (-not $Update) {
    Write-Info "Run '.\update-toolkit.ps1 -Update' to install, or '-Update -Yes' to skip the prompt."
    exit 0
}

# ── -Update: optionally prompt, then install ─────────────────────────────────────
if (-not $Yes -and $Version -eq "") {
    $answer = Read-Host "Update versions.lock and install v$targetVersion? [Y/n]"
    if ($answer -match '^[Nn]') {
        Write-Warn "Update cancelled."
        exit 0
    }
}

# ── Install the pinned version ────────────────────────────────────────────────
$installUrl = "git+$REPO_GIT@v$targetVersion"
Write-Info "Installing kairos-ontology-toolkit v$targetVersion ..."
pip install --upgrade --force-reinstall $installUrl

if ($LASTEXITCODE -ne 0) {
    Write-Err "pip install failed"
    exit 1
}

# ── Write new version back to versions.lock ───────────────────────────────────
$newLock = $lockContent -replace '(?m)^TOOLKIT_VERSION=.*$', "TOOLKIT_VERSION=$targetVersion"
Set-Content $LOCK_FILE $newLock -NoNewline
Write-Success "versions.lock updated → TOOLKIT_VERSION=$targetVersion"

# ── Verify ────────────────────────────────────────────────────────────────────
Write-Info ""
Write-Info "Verifying installation..."
$installedInfo = pip show kairos-ontology-toolkit 2>&1 | Out-String
if ($installedInfo -match 'Version:\s+(.+)') {
    Write-Success "Installed : kairos-ontology-toolkit v$($matches[1].Trim())"
} else {
    Write-Err "Verification failed — package not found after install"
    exit 1
}

Write-Info ""
Write-Success "Toolkit updated $currentVersion → $targetVersion"
Write-Info "Next: review versions.lock, then commit and open a PR."
