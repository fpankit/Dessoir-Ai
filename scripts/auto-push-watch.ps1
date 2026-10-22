param (
    [int]$Interval = 5,
    [int]$Debounce = 10
)

$WorkspaceDir = (Get-Item $PSScriptRoot).Parent.FullName
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Dessoir-AI: Continuous Auto-Push File Watcher" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Directory : $WorkspaceDir"
Write-Host "Check rate: Every $Interval seconds"
Write-Host "Debounce  : $Debounce seconds"
Write-Host "Status    : Running (Press Ctrl+C to stop)..." -ForegroundColor Yellow

while ($true) {
    Start-Sleep -Seconds $Interval
    $status = git -C "$WorkspaceDir" status --porcelain

    if ($status) {
        Write-Host ""
        Write-Host "[CHANGE DETECTED] File changes detected. Waiting $Debounce seconds for saves to settle..." -ForegroundColor Yellow
        Start-Sleep -Seconds $Debounce

        $timeStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Auto-save: $timeStr"

        try {
            Write-Host "[1/3] Staging changes..." -ForegroundColor Yellow
            git -C "$WorkspaceDir" add .

            $staged = git -C "$WorkspaceDir" diff --cached --name-only
            if ($staged) {
                Write-Host "[2/3] Committing changes: $commitMessage" -ForegroundColor Yellow
                git -C "$WorkspaceDir" commit -m "$commitMessage"

                Write-Host "[3/3] Pushing to origin main..." -ForegroundColor Cyan
                git -C "$WorkspaceDir" push origin main
                Write-Host "[SUCCESS] Auto-pushed to GitHub at $timeStr" -ForegroundColor Green
            } else {
                Write-Host "[INFO] No staged changes to commit." -ForegroundColor Gray
            }
        } catch {
            Write-Host "[ERROR] Failed during auto-push: $_" -ForegroundColor Red
        }
    }
}
