# Google Maps API key — EAS production (Android harita karoları)
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey
)

Set-Location $PSScriptRoot\..
Write-Host "EAS production ortamina EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ekleniyor..."
npx eas env:create production `
  --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY `
  --value $ApiKey `
  --visibility plaintext `
  --scope project `
  --force `
  --non-interactive
Write-Host "Tamam. Yeni AAB build gerekir: npm run build:production:android"
