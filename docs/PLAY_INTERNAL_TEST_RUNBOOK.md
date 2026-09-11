# Passla — Google Play Internal Test Runbook

Sürüm hedefi: **1.0.2** (versionCode **4**)

## 1. Kod hazır (tamamlandı)

- Login **Şimdilik Atla** — kart dışında altın outline buton + ScrollView
- Misafir mod: hub, görevler, gate (cüzdan/mesaj/profil/başvuru)
- Onboarding geri + store review gecikmesi + abonelik metinleri + 404 + skeleton + bildirim açıklaması + önbellek

## 2. Service account kontrolü

```powershell
cd bex
.\scripts\prepare-store-submit.ps1
```

| Durum | Ne yap |
|-------|--------|
| `[OK]` tüm dosyalar | Devam et Faz 3 |
| `google-play-service-account.json yok` | Play Console → Setup → API access → JSON indir → `bex/google-play-service-account.json` (commit etme) |
| Doğrulama | `npm run store:verify-play` |

**Alternatif:** Service account yoksa AAB'yi Play Console'dan **elle yükle** (Faz 5B).

## 3. Preview APK smoke test (cihaz)

**Build tamamlandı (1.0.2 kodu):** https://expo.dev/accounts/erdem1803/projects/bex/builds/37ac00c0-e088-4de2-8e0a-6c2cec179891

Telefonda QR veya linke tıkla → APK kur → uygulamayı **silerek** temiz kurulum:

| # | Test | Beklenen |
|---|------|----------|
| 1 | Onboarding → login | 3 slayt, geri çalışır |
| 2 | Login **Şimdilik Atla** | Altın buton görünür → hub |
| 3 | Hub → Görevler | Liste dolu (api.passla.com.tr) |
| 4 | Görev → Başvur | GuestAuthGate |
| 5 | Ayarlar → önbellek | Boyut + temizle |
| 6 | Karanlık mod | Okunaklı |
| 7 | Uçak modu | OfflineBanner, donma yok |
| 8 | Geçersiz URL | 404 ekranı |

Detay: [`QA_MANUAL_TEST.md`](QA_MANUAL_TEST.md)

## 4. Play Console (internal test öncesi)

Uygulama: **com.passla.app** (zaten var)

- [ ] Store listing TR — [`bex/store-listing/play-store-tr.txt`](../bex/store-listing/play-store-tr.txt)
- [ ] Min **2 ekran görüntüsü** — [`bex/store-listing/screenshots/`](../bex/store-listing/screenshots/)
- [ ] Gizlilik: `https://passla.com.tr/gizlilik.html`
- [ ] Destek: `destek@passla.com.tr`
- [ ] Data safety formu (konum, kamera, foto, mesaj, hesap)
- [ ] Content rating 13+
- [ ] Internal testing → tester e-postaları ekle

Adım adım: [`PLAY_CONSOLE_SETUP.md`](PLAY_CONSOLE_SETUP.md)

**Play test notları (reviewer için):**
```
Misafir mod: Login ekranında "Şimdilik Atla" → görevleri inceleyebilirsiniz.
Başvuru/mesaj/cüzdan için ücretsiz kayıt gerekir.
Demo hesap (varsa): ...
```

## 5A. Production AAB + EAS submit

Preview smoke test **geçtikten sonra:**

```powershell
cd bex
npm run build:production:android
```

Service account varsa:
```powershell
npm run submit:android
```

Service account **yoksa** → Faz 5B (manuel yükleme).

## 5B. Manuel AAB yükleme

1. EAS build bitince `.aab` indir
2. Play Console → Testing → Internal testing → Create release → Upload
3. Release notes: misafir mod, onboarding, karanlık mod, görev keşfi

## 6. Play'den indirilen build — son smoke

Internal track'ten kurulan sürümle **Faz 3** checklist'ini tekrarla.

Onay → closed testing → production.
