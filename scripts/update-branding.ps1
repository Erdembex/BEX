# Passla — sadece marka (renk / logo / tema). Backend'e dokunmaz.
# Usage: .\scripts\update-branding.ps1
#        .\scripts\update-branding.ps1 -BuildApk

param(
  [switch]$BuildApk
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "Passla marka guncellemesi (backend YOK)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Duzenlenecek dosyalar:" -ForegroundColor Yellow
Write-Host "  bex/src/theme/colors.ts"
Write-Host "  bex/src/theme/colorsLight.ts"
Write-Host "  bex/assets/icon.png"
Write-Host "  bex/assets/splash-icon.png"
Write-Host "  bex/assets/branding/passla-logo.png (ve ilgili)"
Write-Host "  bex/app.json (primaryColor, backgroundColor)"
Write-Host ""
Write-Host "Backend deploy GEREKMEZ." -ForegroundColor Green
Write-Host ""

Write-Host "==> API saglik kontrolu (opsiyonel)..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "verify-production-api.ps1") -BaseUrl "https://api.passla.com.tr"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Uyari: API kontrolu basarisiz — once backend'e bak." -ForegroundColor Red
  exit 1
}

if ($BuildApk) {
  Write-Host ""
  Write-Host "==> Preview APK build baslatiliyor..." -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot "build-preview-phone.ps1")
} else {
  Write-Host ""
  Write-Host "APK icin:" -ForegroundColor Green
  Write-Host "  .\scripts\update-branding.ps1 -BuildApk"
  Write-Host "  veya: .\scripts\build-preview-phone.ps1"
}

Write-Host ""
Write-Host "Bitti." -ForegroundColor Green
