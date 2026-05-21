# Free space on C: — run in PowerShell: .\scripts\free-c-drive-space.ps1
$ErrorActionPreference = "SilentlyContinue"

function Get-FreeMB($drive) {
  (Get-PSDrive $drive).Free / 1MB
}

Write-Host "C: free BEFORE: $([math]::Round((Get-FreeMB C), 1)) MB"

# 1. npm cache (~9 GB typical)
$npmCache = "$env:LOCALAPPDATA\npm-cache"
if (Test-Path $npmCache) {
  Write-Host "Removing $npmCache ..."
  Remove-Item $npmCache -Recurse -Force
  Write-Host "  Done."
}

# 2. Temp files
$temp = $env:TEMP
if (Test-Path $temp) {
  Write-Host "Cleaning $temp ..."
  Get-ChildItem $temp -Force | Remove-Item -Recurse -Force
}

# 3. Next.js build cache (on E: project — optional)
$nextDir = "E:\Project\LLMs Project\.next"
if (Test-Path $nextDir) {
  Write-Host "Removing .next cache ..."
  Remove-Item $nextDir -Recurse -Force
}

Write-Host "C: free AFTER:  $([math]::Round((Get-FreeMB C), 1)) MB"
Write-Host ""
Write-Host "Next: cd to project and run: npm run dev"
