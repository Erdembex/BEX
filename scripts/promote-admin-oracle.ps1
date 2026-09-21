# admin@bex.dev hesabini production DB'de ADMIN yapar (sifre degismez).
# Usage: .\scripts\promote-admin-oracle.ps1
param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$Email = "admin@bex.dev"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$RemoteScript = Join-Path $PSScriptRoot "promote-admin-remote.sh"

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH key bulunamadi: $SshKey"
}
if (-not (Test-Path $RemoteScript)) {
  Write-Error "Remote script bulunamadi: $RemoteScript"
}

Write-Host "==> $Email production'da ADMIN yapiliyor..."
scp -i $SshKey -o StrictHostKeyChecking=no $RemoteScript "${Remote}:/tmp/promote-admin.sh"
ssh -i $SshKey -o StrictHostKeyChecking=no $Remote "bash /tmp/promote-admin.sh '$Email' && rm /tmp/promote-admin.sh"
Write-Host "==> Tamam. Uygulamada cikis yapip tekrar giris yapin veya uygulamayi yenileyin."
