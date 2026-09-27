# Passla — Production hazırlık özeti

Öncelik sırasıyla tamamlanması gereken maddeler.

## 1. Harita (hub’da kaldırıldı)

Keşif **il/ilçe filtresi** ile; tam ekran harita şu an üründe yok. Backend geocode işletme profili için devam edebilir (ileride). Maps API key internal test için **zorunlu değil**. Eski not: `MAP_SETUP.md`.

---

## 2. Internal test build

- AAB: **1.0.2 (versionCode 9)** — `store-listing/KAPALI_TEST_VC9.md`
- Play: `store-listing/PLAY_CONSOLE_INTERNAL_FORMS.md`
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

Karar: `store-listing/BILLING_KARAR.md` — kapalı test ve ilk üretimde uygulama içi satış yok; işletme ücreti web faturası. Varsayılan kod: `manual`.

Canlı kart ödemesi için: `APP_PAYMENT_PROVIDER=iyzico` + `IyzicoPaymentGateway` tamamlanmalı (şu an placeholder).

Admin: `POST .../admin/subscriptions/{businessId}/confirm-payment`

---

## Backend deploy notu

Geocode backfill: uygulama açılışında 100 işletme + saatte 30 işletme (`BusinessGeocodeScheduler`). Prod restart sonrası koordinatların dolması birkaç saat sürebilir.
