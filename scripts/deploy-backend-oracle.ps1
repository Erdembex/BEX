# Oracle sunucuya backend deploy (kaynak kodu rsync + sunucuda Maven build)
# Usage: .\scripts\deploy-backend-oracle.ps1
param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$RemoteRepo = "~/BARTER_EXCHANGE"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH key bulunamadi: $SshKey"
}

Write-Host "==> Backend kaynak kodu sunucuya gonderiliyor..."
$backendSrc = Join-Path $Root "takkas-backend"
scp -i $SshKey -r "$backendSrc\src" "$backendSrc\pom.xml" "${Remote}:${RemoteRepo}/takkas-backend/"

Write-Host "==> Sunucuda Maven build + restart..."
$repoPath = $RemoteRepo -replace '~/', '/home/ubuntu/'
$remoteCmd = 'set -e; cd REPO_PATH/takkas-backend && mvn -B package -DskipTests -q && sudo cp target/takkas-backend-*.jar /opt/takkas/takkas-backend.jar && sudo systemctl restart takkas && for i in $(seq 1 36); do if curl -sf http://127.0.0.1:8080/actuator/health >/dev/null 2>&1; then echo Health UP; curl -sS http://127.0.0.1:8080/actuator/health; echo; exit 0; fi; sleep 10; done; echo Health check timed out >&2; sudo journalctl -u takkas -n 20 --no-pager; exit 1' -replace 'REPO_PATH', $repoPath

ssh -i $SshKey -o StrictHostKeyChecking=no $Remote "bash -lc '$remoteCmd'"
Write-Host "==> Deploy tamamlandi."
