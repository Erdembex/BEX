# Passla — Harita kurulumu

## 1. Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services
2. Etkinleştir: **Maps SDK for Android** (iOS için Maps SDK for iOS)
3. Credentials → API key oluştur
4. Kısıtla: Android apps → `com.passla.app` + SHA-1 (EAS keystore — `eas credentials`)

## 2. EAS (internal / production AAB)

```powershell
cd bex
.\scripts\setup-google-maps-eas.ps1 -ApiKey "AIza..."
npm run build:production:android
```

Yerel geliştirme (Expo Go / dev client):

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

`.env` dosyasına ekle, `npx expo start --clear`.

## 3. Backend koordinatları

- İşletme: il + ilçe + **açık adres** zorunlu
- Kayıt/güncellemede otomatik geocode
- Prod restart sonrası backfill (100 + saatte 30 işletme)

Kontrol: API listing kartında `businessLatitude` / `businessLongitude` dolu mu?

## 4. Uygulama davranışı

- Harita **şehir/ilçe** filtresine göre pin gösterir
- Pin → görev detayı
- Android’de key yoksa üstte uyarı bandı görünür
- Pin yoksa “Tüm görevleri gör” → görevler sekmesi

## 5. Test

1. Internal test AAB (key’li build)
2. Profil veya haritada **İstanbul** (veya ilan olan şehir)
3. Hub → Harita → karolar + pin
4. Pin’e dokun → görev açılır
