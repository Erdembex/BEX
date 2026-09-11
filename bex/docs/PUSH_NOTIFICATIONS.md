# Passla — Push Bildirim Kurulumu

Kilit ekranı ve bildirim çubuğunda push için **mobil uygulama + backend + EAS/FCM** birlikte yapılandırılmalıdır.

## Nasıl çalışır?

1. Kullanıcı giriş yapar → bildirim izni verir.
2. Uygulama **Expo push token** alır → `POST /api/device/fcm-token` ile backend'e kaydeder.
3. Olay oluşur (başvuru, mesaj, kupon, takas…) → backend DB'ye yazar + push gönderir.
4. Telefon: kilit ekranı banner + ses + badge; uygulama içi: Menü → Bildirimler.

## 1. Mobil (EAS build)

### Gerekli

- `app.json` → `extra.eas.projectId` (mevcut)
- `eas.json` → `EXPO_PUBLIC_EAS_PROJECT_ID` (build profillerinde)
- **Expo Go ile gerçek push testi sınırlıdır** — `preview-phone` veya `production` APK/AAB kullanın.

### Android (Play / internal test)

1. [Expo dashboard](https://expo.dev) → Proje → **Credentials** → Android → **FCM V1 service account key** yükle  
   (Firebase Console → Project settings → Service accounts → Generate new private key)
2. Yeni build alın (native credential değişince rebuild şart):

```bash
cd bex
npm run build:preview-phone:android
# veya production
npm run build:production:android
```

### iOS (ileride)

1. Apple Developer → Push Notifications capability
2. Expo credentials → APNs key
3. `npm run build:production:ios`

## 2. Backend (takkas-backend)

Production ortam değişkenleri:

| Değişken | Açıklama |
|----------|----------|
| `EXPO_ACCESS_TOKEN` | expo.dev/settings/access-tokens — Expo Push API (önerilir) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `/app/firebase-sa.json` — native FCM token'ları için |

`docker-compose.prod.yml` örneği:

```yaml
environment:
  EXPO_ACCESS_TOKEN: ${EXPO_ACCESS_TOKEN}
  FIREBASE_SERVICE_ACCOUNT_PATH: /app/firebase-sa.json
volumes:
  - ./firebase-sa.json:/app/firebase-sa.json:ro
```

## 3. Uygulama tarafında yapılanlar

- Android bildirim kanalı **HIGH** + kilit ekranı görünürlüğü
- İzin sonrası token kaydı bug'ı düzeltildi
- Uygulama ön plana gelince token yenileme
- Bildirime tıklayınca / soğuk açılışta yönlendirme
- Normal sohbet mesajları için push (`MessageSentEvent`)

## 4. Test checklist

- [ ] EAS `preview-phone` APK yüklü (Expo Go değil)
- [ ] Backend `https://api.passla.com.tr` erişilebilir
- [ ] Giriş → bildirim izni **İzin ver**
- [ ] Log: `[push] Expo push token:` ve `Token backend'e kaydedildi`
- [ ] Başka hesapla başvuru kabul / mesaj gönder
- [ ] Kilit ekranında banner görünür
- [ ] Menü → Bildirimler'de kayıt var

## Otomatik bildirim türleri

Başvuru, teslim, kupon, takas, abonelik, KYC, yeni mesaj (sohbet), takas sohbeti.
