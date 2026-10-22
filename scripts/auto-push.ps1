param (
    [string]$msg = ""
)

$status = git status --porcelain

if (-not $status) {
    Write-Host "[OK] Working tree clean. Nothing to push." -ForegroundColor Green
    exit 0
}

if (-not $msg) {
    $timeStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $msg = "Auto-update: $timeStr"
}

Write-Host "[1/3] Staging changes..." -ForegroundColor Yellow
git add .

Write-Host "[2/3] Committing: '$msg'..." -ForegroundColor Yellow
git commit -m "$msg"

Write-Host "[3/3] Pushing to GitHub (origin/main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Pushed to https://github.com/fpankit/Dessoir-Ai" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Git push failed." -ForegroundColor Red
}
