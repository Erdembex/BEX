# Hesap silme ve veri ihraci uclarinin smoke testi.
#
# Varsayilan calisma (guvenli): sadece kimlik dogrulamasiz erisimin kapali
# oldugunu ve veri ihracinin calistigini kontrol eder, hicbir hesabi silmez.
#
# Usage:
#   .\scripts\verify-account-endpoints.ps1 -Email test@ornek.com -Password Sifre123
#   .\scripts\verify-account-endpoints.ps1 -Email tek@kullanimlik.com -Password Sifre123 -DeleteAccount

param(
  [string]$BaseUrl = "https://api.passla.com.tr",
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$Password,
  # DIKKAT: bu anahtar verilirse hesap GERCEKTEN ve GERI DONUSSUZ silinir.
  [switch]$DeleteAccount
)

$BaseUrl = $BaseUrl.TrimEnd("/")
$fail = 0

function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Bad($msg)  { Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:fail++ }
function Write-Info($msg) { Write-Host "     $msg" -ForegroundColor DarkGray }

Write-Host "==> API: $BaseUrl" -ForegroundColor Cyan

# 1) Jetonsuz erisim kapali olmali
$code = curl.exe -sS -m 15 -o NUL -w "%{http_code}" "$BaseUrl/api/account/me/export"
if ([int]$code -in @(401, 403)) { Write-Ok "Veri ihraci jetonsuz erisimi reddediyor ($code)" }
elseif ([int]$code -eq 404)     { Write-Bad "Uc bulunamadi (404) - backend henuz deploy edilmemis" }
else                            { Write-Bad "Veri ihraci jetonsuz $code dondu, 401/403 bekleniyordu" }

# 2) Giris
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
try {
  $auth = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" `
    -ContentType "application/json" -Body $loginBody -TimeoutSec 20
  Write-Ok "Giris basarili ($($auth.userType))"
} catch {
  Write-Bad "Giris basarisiz: $($_.Exception.Message)"
  Write-Host "`n$fail kontrol basarisiz." -ForegroundColor Red
  exit 1
}

$headers = @{ Authorization = "Bearer $($auth.accessToken)" }

# 3) Veri ihraci
try {
  $export = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/account/me/export" `
    -Headers $headers -TimeoutSec 30
  if ($export.account.email -eq $Email) { Write-Ok "Veri ihraci dogru hesabi dondurdu" }
  else { Write-Bad "Veri ihracindaki e-posta beklenenden farkli: $($export.account.email)" }

  Write-Info "durum        : $($export.account.status)"
  Write-Info "kupon sayisi : $(@($export.coupons).Count)"
  Write-Info "ilan sayisi  : $(@($export.listings).Count)"

  $outFile = Join-Path $env:TEMP "passla-export-test.json"
  $export | ConvertTo-Json -Depth 8 | Set-Content -Path $outFile -Encoding UTF8
  Write-Info "cikti        : $outFile"

  # QR token sizmasi olmamali
  if ((Get-Content $outFile -Raw) -match '"qrToken"') {
    Write-Bad "Veri ihracinda qrToken var - kupon jetonlari sizmamalı"
  } else {
    Write-Ok "Veri ihracinda kupon QR jetonu yok"
  }
} catch {
  Write-Bad "Veri ihraci basarisiz: $($_.Exception.Message)"
}

# 4) Yanlis sifreyle silme reddedilmeli
$wrongBody = @{ password = "KesinlikleYanlisSifre1"; reason = $null } | ConvertTo-Json -Compress
try {
  Invoke-RestMethod -Method Delete -Uri "$BaseUrl/api/account/me" `
    -Headers $headers -ContentType "application/json" -Body $wrongBody -TimeoutSec 20 | Out-Null
  Write-Bad "Yanlis sifreyle silme KABUL EDILDI - kritik hata"
} catch {
  $status = [int]$_.Exception.Response.StatusCode
  if ($status -eq 422) { Write-Ok "Yanlis sifreyle silme reddedildi (422)" }
  else { Write-Bad "Yanlis sifre $status dondu, 422 bekleniyordu" }
}

# 5) Hesap hala kullanilabilir olmali
try {
  Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/account/me/export" `
    -Headers $headers -TimeoutSec 20 | Out-Null
  Write-Ok "Basarisiz silme denemesinden sonra hesap hala aktif"
} catch {
  Write-Bad "Hesap basarisiz silme denemesinden sonra erisilemez oldu"
}

if ($DeleteAccount) {
  Write-Host ""
  Write-Host "!! $Email hesabi kalici olarak silinecek." -ForegroundColor Yellow
  $confirm = Read-Host "Devam etmek icin SIL yaz"
  if ($confirm -ne "SIL") {
    Write-Host "Iptal edildi." -ForegroundColor Yellow
  } else {
    $deleteBody = @{ password = $Password; reason = "Otomatik dogrulama testi" } | ConvertTo-Json -Compress
    try {
      Invoke-RestMethod -Method Delete -Uri "$BaseUrl/api/account/me" `
        -Headers $headers -ContentType "application/json" -Body $deleteBody -TimeoutSec 30 | Out-Null
      Write-Ok "Hesap silindi (204)"
    } catch {
      Write-Bad "Silme basarisiz: $($_.Exception.Message)"
    }

    # Eski jeton artik reddedilmeli
    try {
      Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/account/me/export" `
        -Headers $headers -TimeoutSec 20 | Out-Null
      Write-Bad "Silinen hesabin jetonu HALA calisiyor - kritik hata"
    } catch {
      $status = [int]$_.Exception.Response.StatusCode
      if ($status -eq 403) { Write-Ok "Silinen hesabin erisim jetonu reddediliyor (403)" }
      else { Write-Bad "Silinen hesabin jetonu $status dondu, 403 bekleniyordu" }
    }

    # Eski e-posta ile giris yapilamamali
    try {
      Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" `
        -ContentType "application/json" -Body $loginBody -TimeoutSec 20 | Out-Null
      Write-Bad "Silinen hesaba giris yapilabiliyor - kritik hata"
    } catch {
      $status = [int]$_.Exception.Response.StatusCode
      if ($status -eq 422) { Write-Ok "Silinen hesaba giris reddediliyor (422)" }
      else { Write-Bad "Silinen hesap girisi $status dondu, 422 bekleniyordu" }
    }
  }
}

Write-Host ""
if ($fail -eq 0) {
  Write-Host "Tum kontroller gecti." -ForegroundColor Green
  exit 0
} else {
  Write-Host "$fail kontrol basarisiz." -ForegroundColor Red
  exit 1
}
