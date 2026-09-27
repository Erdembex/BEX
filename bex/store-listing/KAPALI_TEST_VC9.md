# Passla 1.0.2 — Kapalı test (versionCode 9)

Paket: `com.passla.app`  
AAB: https://expo.dev/artifacts/eas/BT5Vi-yNEbF6x3w9NB9dQN1htWAjszZfZm1z3baLp84.aab  
Build: https://expo.dev/accounts/erdem1803/projects/bex/builds/4702cb9f-9e9f-4bde-b319-2d5bac9e89df

`google-play-service-account.json` repoda yok. Yükleme Play Console’dan elle yapılır. `eas submit` bu dosya olmadan çalışmaz.

## 1. Sürümü yükle

1. https://play.google.com/console → Passla
2. **Test edin ve yayınlayın → Kapalı test** (Dahili test değil)
3. **Yeni sürüm oluştur**
4. Yukarıdaki `.aab` dosyasını sürükle (versionCode **9**)
5. Sürüm notu: `INTERNAL_TEST_RELEASE_NOTES.txt`
6. **İncele → Yayınla**

Kapalı test kanalı yoksa önce **Kapalı test oluştur** (bir e-posta listesi yeter).

## 2. En az 15 test kullanıcısı

Şablon: `testers.csv` — Gmail adreslerini doldur, başlık satırını silmeden Play’e yapıştır.

1. Kapalı test → **Test kullanıcıları** → e-posta listesi oluştur: `Passla kapalı test`
2. CSV’deki adresleri ekle (hedef 15, Google üretim şartı için en az 12’si 14 gün kayıtlı kalsın)
3. **Bağlantıyı kopyala** (opt-in)

Kişisel geliştirici hesabı 13 Kasım 2023’ten sonraysa üretime geçmek için bu 12 kişi 14 gün üst üste opt-in kalmalı.

## 3. Davet metni (kopyala)

```
Passla kapalı testine davetlisin.

1. Bu linki telefonda aç (Play Store yüklü olsun):
   [KAPALI TEST OPT-IN LINKINI BURAYA YAPIŞTIR]
2. "Test kullanıcısı ol" de.
3. Play Store’dan Passla’yı indir. Expo Go değil.

Dene: kayıt, yakındaki görev, başvuru, mesaj, kupon.
Bozuk ekran görürsen ekran görüntüsü at.
```

## 4. Onlardan isteyeceğin tur

1. Kayıt veya giriş
2. Ana sayfada bir görev kartı aç
3. Başvur veya mevcut başvuruya bak
4. Mesaj yaz
5. Varsa kupon / cüzdan ekranını aç

Hata olursa: ekran adı + ekran görüntüsü. Her küçük hata için yeni AAB yayınlama; tur bitince tek sürüm.
