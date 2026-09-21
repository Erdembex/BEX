# BEX Mobil — EAS Production Build

## 1. EAS projesini bağla

```bash
cd bex
npm install
npx eas login
npx eas init
```

`eas init` sonrası `app.json` → `extra.eas.projectId` otomatik eklenir.

## 2. Production secrets

**Script ile (önerilen):**

Windows:
```powershell
cd bex
.\scripts\setup-eas-secrets.ps1 -ApiDomain api.SENIN-DOMAIN `
  -EasProjectId "..." `
  -FirebaseApiKey "..." `
  -FirebaseAuthDomain "..." `
  -FirebaseProjectId "..." `
  -FirebaseStorageBucket "..." `
  -FirebaseMessagingSenderId "..." `
  -FirebaseAppId "..."
```

macOS/Linux:
```bash
export EXPO_PUBLIC_FIREBASE_API_KEY=...
# diğer EXPO_PUBLIC_FIREBASE_* ...
./scripts/setup-eas-secrets.sh api.SENIN-DOMAIN
```

Manuel:
```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://api.SENIN-DOMAIN
```

Secrets listesi: `eas secret:list`

**Harita (production / internal AAB):**

```bash
npx eas env:create production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "AIza..." --visibility plaintext --scope project --force --non-interactive
```

**App Check (internal test, Firebase enforcement öncesi):**

```bash
npx eas env:create production --name EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN --value "UUID-from-firebase" --visibility secret --scope project --force --non-interactive
```

Detay: `store-listing/PRODUCTION_READINESS.md`, test listesi: `store-listing/INTERNAL_E2E_TEST.md`

## 3. Preview build (internal test)

```bash
npm run build:preview:android   # APK — telefona direkt yükle
```

## 4. Production build

```bash
npm run build:production
# veya
eas build --profile production --platform android
eas build --profile production --platform ios
```

`eas.json` production profili:
- `autoIncrement: true` — build numarası otomatik artar
- `APP_VARIANT=production`

## 5. Version bump (store güncellemesi)

`app.json` → `expo.version` (örn. 1.0.0 → 1.0.1)

## 6. Submit

```bash
npm run submit:android
npm run submit:ios
npm run submit:all    # her iki platform
# veya
bash scripts/store-submit-all.sh
```

Detay: [`docs/PLAY_CONSOLE_SETUP.md`](../docs/PLAY_CONSOLE_SETUP.md), [`docs/APP_STORE_CONNECT_SETUP.md`](../docs/APP_STORE_CONNECT_SETUP.md)
