#!/usr/bin/env pwsh
# Start the Ontology Viewer in production mode

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Ontology Viewer..." -ForegroundColor Cyan

# Check if npm is installed
Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if (-not $npmVersion) {
        throw "npm not found"
    }
    Write-Host "   ✓ npm v$npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Navigate to viewer directory
Set-Location "$PSScriptRoot\ontology-viewer"

# Check if node_modules exists, if not run npm install
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📥 Installing dependencies (first run)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✓ Dependencies already installed" -ForegroundColor Green
}

# Build the application
Write-Host "`n📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build successful!" -ForegroundColor Green

# Start the server in the background
Write-Host "`n🌐 Starting production server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run start
}

# Wait for server to be ready
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Open browser
$url = "http://localhost:3000"
Write-Host "`n🌍 Opening browser at $url" -ForegroundColor Cyan
Start-Process $url

Write-Host "`n✨ Ontology Viewer is running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Keep script running and show server output
try {
    Receive-Job -Job $serverJob -Wait
} finally {
    # Cleanup on exit
    Write-Host "`n🛑 Stopping server..." -ForegroundColor Yellow
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob
}
