#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Release script for Customer Ontology Hub
    
.DESCRIPTION
    Automates version bumping, validation, projection generation, and release tagging
    
.PARAMETER BumpType
    Type of version bump: major, minor, or patch
    
.PARAMETER Message
    Optional custom commit message
    
.EXAMPLE
    .\release.ps1 -BumpType minor
    .\release.ps1 -BumpType major -Message "Breaking change: New partner model"
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch")]
    [string]$BumpType,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

# Fix Windows console encoding for Unicode/emoji output from Python tools
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Color output functions
function Write-Success { param([string]$msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error-Custom { param([string]$msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param([string]$msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning-Custom { param([string]$msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "🚀 Customer Ontology Hub - Release Script" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Error-Custom "Not in a git repository!"
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning-Custom "You have uncommitted changes:"
    git status --short
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Info "Release cancelled"
        exit 0
    }
}

# Get current version from pyproject.toml
$pyprojectContent = Get-Content "pyproject.toml" -Raw
if ($pyprojectContent -match 'version\s*=\s*"(\d+)\.(\d+)\.(\d+)"') {
    $currentMajor = [int]$matches[1]
    $currentMinor = [int]$matches[2]
    $currentPatch = [int]$matches[3]
    $currentVersion = "$currentMajor.$currentMinor.$currentPatch"
    Write-Info "Current version: $currentVersion"
} else {
    Write-Error-Custom "Could not parse version from pyproject.toml"
    exit 1
}

# Prompt for bump type if not provided
if (-not $BumpType) {
    Write-Host ""
    Write-Host "Select version bump type:" -ForegroundColor Yellow
    Write-Host "  1. Major (breaking changes) - $currentMajor.$currentMinor.$currentPatch → $($currentMajor + 1).0.0"
    Write-Host "  2. Minor (new features)      - $currentMajor.$currentMinor.$currentPatch → $currentMajor.$($currentMinor + 1).0"
    Write-Host "  3. Patch (bug fixes)         - $currentMajor.$currentMinor.$currentPatch → $currentMajor.$currentMinor.$($currentPatch + 1)"
    Write-Host ""
    
    do {
        $choice = Read-Host "Enter choice (1-3)"
    } while ($choice -notin @("1", "2", "3"))
    
    $BumpType = switch ($choice) {
        "1" { "major" }
        "2" { "minor" }
        "3" { "patch" }
    }
}

# Calculate new version
$newVersion = switch ($BumpType) {
    "major" { "$($currentMajor + 1).0.0" }
    "minor" { "$currentMajor.$($currentMinor + 1).0" }
    "patch" { "$currentMajor.$currentMinor.$($currentPatch + 1)" }
}

Write-Host ""
Write-Success "Version bump: $currentVersion → $newVersion ($BumpType)"
Write-Host ""

# Confirm release
$confirm = Read-Host "Continue with release? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Info "Release cancelled"
    exit 0
}

Write-Host ""
Write-Host "📝 Updating version numbers..." -ForegroundColor Blue

# Update pyproject.toml
$pyprojectContent = $pyprojectContent -replace 'version\s*=\s*"\d+\.\d+\.\d+"', "version = `"$newVersion`""
Set-Content "pyproject.toml" $pyprojectContent -NoNewline
Write-Success "Updated pyproject.toml"

# Update ontology files
$ontologyFiles = @(
    "ontology-hub/ontologies/customer.ttl",
    "ontology-hub/ontologies/order.ttl",
    "ontology-hub/ontologies/product.ttl"
)

foreach ($file in $ontologyFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'owl:versionInfo\s*"\d+\.\d+\.\d+"', "owl:versionInfo `"$newVersion`""
        Set-Content $file $content -NoNewline
        Write-Success "Updated $file"
    }
}

Write-Host ""
Write-Host "🔍 Running validation..." -ForegroundColor Blue

# Validate ontologies
$validateCmd = "kairos-ontology validate --ontologies ontology-hub/ontologies --shapes ontology-hub/shapes --catalog ontology-reference-models/catalog-v001.xml"
$validateResult = Invoke-Expression $validateCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Validation failed! Please fix errors before releasing."
    
    # Revert version changes
    Write-Warning-Custom "Reverting version changes..."
    git checkout pyproject.toml
    foreach ($file in $ontologyFiles) {
        if (Test-Path $file) {
            git checkout $file
        }
    }
    exit 1
}

Write-Success "Validation passed"
Write-Host ""
Write-Host "📊 Generating projections..." -ForegroundColor Blue

# Generate all projections
$projectCmd = "kairos-ontology project --ontologies ontology-hub/ontologies --catalog ontology-reference-models/catalog-v001.xml --output ontology-hub/output --target all"
$projectResult = Invoke-Expression $projectCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Projection generation failed!"
    
    # Revert version changes
    Write-Warning-Custom "Reverting version changes..."
    git checkout pyproject.toml
    foreach ($file in $ontologyFiles) {
        if (Test-Path $file) {
            git checkout $file
        }
    }
    exit 1
}

Write-Success "Projections generated"
Write-Host ""
Write-Host "📦 Committing changes..." -ForegroundColor Blue

# Stage all changes
git add -A

# Create commit message
if (-not $Message) {
    $Message = switch ($BumpType) {
        "major" { "BREAKING CHANGE: Release v$newVersion" }
        "minor" { "feat: Release v$newVersion" }
        "patch" { "fix: Release v$newVersion" }
    }
}

# Commit
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Git commit failed!"
    exit 1
}

Write-Success "Changes committed"

# Create tag
Write-Host ""
Write-Host "🏷️  Creating release tag..." -ForegroundColor Blue
git tag -a "v$newVersion" -m "Release v$newVersion"

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Git tag creation failed!"
    exit 1
}

Write-Success "Tag v$newVersion created"

# Ask about pushing
Write-Host ""
$push = Read-Host "Push to remote? (y/N)"

if ($push -eq "y" -or $push -eq "Y") {
    Write-Host ""
    Write-Host "⬆️  Pushing to remote..." -ForegroundColor Blue
    
    # Get current branch
    $currentBranch = git branch --show-current
    
    # Push commits
    git push origin $currentBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Git push failed!"
        exit 1
    }
    
    # Push tags
    git push origin "v$newVersion"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Tag push failed!"
        exit 1
    }
    
    Write-Success "Pushed to remote"
} else {
    Write-Info "Changes committed locally only. Push later with:"
    Write-Host "  git push origin $(git branch --show-current)" -ForegroundColor Gray
    Write-Host "  git push origin v$newVersion" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Success "Release v$newVersion completed!"
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "📋 Release Summary:" -ForegroundColor Cyan
Write-Host "  Version: $currentVersion → $newVersion" -ForegroundColor White
Write-Host "  Type: $BumpType" -ForegroundColor White
Write-Host "  Tag: v$newVersion" -ForegroundColor White
Write-Host "  Commit: $Message" -ForegroundColor White
Write-Host ""
