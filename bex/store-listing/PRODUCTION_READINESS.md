# Passla — Production hazırlık özeti

Öncelik sırasıyla tamamlanması gereken maddeler.

## 1. Harita

| Görev | Durum |
|--------|--------|
| Backend işletme `latitude/longitude` (Nominatim + backfill) | Kodda var; prod DB’de dolması gerekir |
| İlan kartında `businessLatitude/Longitude` | API’den geliyor |
| Uygulama önce sunucu koordinatını kullanır | `mapBusinessService.ts` |
| Google Maps API key (EAS production) | **Senin eklemen gerekir** |

```powershell
cd bex
npx eas env:create production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "AIza..." --visibility plaintext --scope project --force --non-interactive
```

Google Cloud Console: Maps SDK for Android + iOS etkin, key kısıtları `com.passla.app`.

---

## 2. Internal test build

- `npm run build:production:android`
- Play Console internal track
- Test: `store-listing/INTERNAL_E2E_TEST.md`

---

## 3. Mağaza varlıkları

| Dosya | Not |
|--------|-----|
| `assets/icon.png` | 512×512 |
| `store-listing/feature-graphic-1024x500.png` | Öne çıkan grafik |
| `store-listing/play-store-tr.txt` | TR uzun/kısa açıklama |
| `store-listing/play-store-en.txt` | EN (TR ile uyumlu) |
| `store-listing/screenshots/` | Gerçek cihaz çekimi tercih edilir |

---

## 4. App Check + bildirim

**App Check (mobil prod):** `src/lib/appCheck.ts` — internal test build’lerde EAS’e debug token koyulabilir; tam prod’da Play Integrity / DeviceCheck yapılandırması Firebase Console’dan ayrı adım.

```powershell
npx eas env:create production --name EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN --value "..." --visibility secret --scope project
```

Firebase Console → App Check → Enforcement: Firestore/Storage/Functions için yalnızca testler yeşil olduktan sonra aç.

**Bildirim:** FCM + `expo-notifications`; internal AAB’de push token kaydı ve arka plan bildirimi `INTERNAL_E2E_TEST.md` bölüm 4.

---

## 5. Abonelik / ödeme

Varsayılan: `app.payment.provider=manual` — checkout harici POS’a gitmez; referans kodu + admin onayı (`ManualPaymentGateway`).

Canlı kart ödemesi için: `APP_PAYMENT_PROVIDER=iyzico` + `IyzicoPaymentGateway` tamamlanmalı (şu an placeholder).

Admin: `POST .../admin/subscriptions/{businessId}/confirm-payment`

---

## Backend deploy notu

Geocode backfill: uygulama açılışında 100 işletme + saatte 30 işletme (`BusinessGeocodeScheduler`). Prod restart sonrası koordinatların dolması birkaç saat sürebilir.
