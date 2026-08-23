# SendGrid mail secret'larini Oracle sunucuya uygular (key chat'e gitmez)
# Usage: .\scripts\apply-sendgrid-oracle.ps1

param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
  $SecretsFile = Join-Path $Root "takkas-backend\deploy\mail\secrets.local.env"
}

if (-not (Test-Path $SecretsFile)) {
  Write-Error "secrets.local.env bulunamadi: $SecretsFile"
}

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH key bulunamadi: $SshKey"
}

Write-Host "==> SendGrid ayarlari sunucuya gonderiliyor..."
scp -i $SshKey $SecretsFile "${Remote}:/tmp/passla-mail-secrets.env"

Write-Host "==> Sunucuda .env guncelleniyor + takkas yeniden baslatiliyor..."
$bashScript = @'
set -e
ENV_FILE="/opt/takkas/.env"
sudo touch "$ENV_FILE"
while IFS='=' read -r key value || [ -n "$key" ]; do
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  value="${value//$'\r'/}"
  value="${value%%#*}"
  value="$(printf '%s' "$value" | sed 's/[[:space:]]*$//')"
  if sudo grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sudo sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" | sudo tee -a "$ENV_FILE" >/dev/null
  fi
done < /tmp/passla-mail-secrets.env
rm -f /tmp/passla-mail-secrets.env
sudo systemctl restart takkas
sleep 120
curl -sS -m 20 http://127.0.0.1:8080/actuator/health || echo HEALTH_FAIL
echo
sudo grep -E '^SPRING_MAIL_(HOST|FROM|USERNAME)=' "$ENV_FILE" 2>/dev/null || echo "MAIL_ENV_MISSING"
sudo grep -q '^SPRING_MAIL_PASSWORD=.' "$ENV_FILE" 2>/dev/null && echo "SPRING_MAIL_PASSWORD=set" || echo "SPRING_MAIL_PASSWORD=MISSING"
'@

$bashScript | ssh -i $SshKey -o StrictHostKeyChecking=no $Remote "bash -s"
Write-Host "==> Bitti. Simdi uygulamadan Sifremi unuttum ile test et."
