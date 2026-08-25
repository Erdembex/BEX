# Passla — EAS environment variables (production + preview)
# Usage: .\scripts\setup-eas-secrets.ps1 -ApiDomain "api.passla.com.tr" -FirebaseApiKey "..." ...
param(
  [string]$ApiDomain = "",
  [string]$ApiUrl = "",
  [string]$EasProjectId = "",
  [string]$FirebaseApiKey = "",
  [string]$FirebaseAuthDomain = "",
  [string]$FirebaseProjectId = "",
  [string]$FirebaseStorageBucket = "",
  [string]$FirebaseMessagingSenderId = "",
  [string]$FirebaseAppId = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Invoke-Eas {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$EasArgs
  )
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & npx --yes eas @EasArgs
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) {
    throw "eas $($EasArgs -join ' ') failed (exit $code)"
  }
}

Write-Host "==> EAS login kontrol..." -ForegroundColor Cyan
Invoke-Eas whoami | Out-Host

function Set-EasEnv {
  param(
    [string]$Name,
    [string]$Value,
    [string]$Environment
  )
  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "  ATLA: $Name ($Environment)" -ForegroundColor DarkYellow
    return
  }
  Write-Host "  -> $Name ($Environment)" -ForegroundColor Green
  Invoke-Eas env:create $Environment `
    --name $Name `
    --value $Value `
    --force `
    --non-interactive `
    --visibility plaintext `
    --scope project | Out-Null
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
  if ([string]::IsNullOrWhiteSpace($ApiDomain)) {
    Write-Host "ApiDomain veya ApiUrl ver." -ForegroundColor Red
    exit 1
  }
  $ApiUrl = "https://$ApiDomain"
}

$vars = [ordered]@{
  EXPO_PUBLIC_API_BASE_URL                 = $ApiUrl
  EXPO_PUBLIC_EAS_PROJECT_ID               = $EasProjectId
  EXPO_PUBLIC_FIREBASE_API_KEY             = $FirebaseApiKey
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN         = $FirebaseAuthDomain
  EXPO_PUBLIC_FIREBASE_PROJECT_ID          = $FirebaseProjectId
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET      = $FirebaseStorageBucket
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = $FirebaseMessagingSenderId
  EXPO_PUBLIC_FIREBASE_APP_ID              = $FirebaseAppId
  EXPO_PUBLIC_USE_DEMO_DATA                = "false"
}

foreach ($envName in @("production", "preview")) {
  Write-Host "==> Environment: $envName (API: $ApiUrl)" -ForegroundColor Cyan
  foreach ($entry in $vars.GetEnumerator()) {
    Set-EasEnv -Name $entry.Key -Value $entry.Value -Environment $envName
  }
}

Write-Host "`n==> production env:" -ForegroundColor Cyan
Invoke-Eas env:list production | Out-Host

Write-Host "`n==> preview env:" -ForegroundColor Cyan
Invoke-Eas env:list preview | Out-Host

Write-Host "`nTamam. Sonraki: npm run build:preview:android" -ForegroundColor Green
