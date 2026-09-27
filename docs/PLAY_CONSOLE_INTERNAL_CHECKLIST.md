# Play Console — Internal Test Checklist (com.passla.app)

**Sürüm:** 1.0.2 · **versionCode 9** · AAB: [Expo artifact](https://expo.dev/artifacts/eas/BT5Vi-yNEbF6x3w9NB9dQN1htWAjszZfZm1z3baLp84.aab) · Adım: `bex/store-listing/KAPALI_TEST_VC9.md`  
**Detaylı form cevapları:** [`bex/store-listing/PLAY_CONSOLE_INTERNAL_FORMS.md`](../bex/store-listing/PLAY_CONSOLE_INTERNAL_FORMS.md)

Her maddeyi Play Console'da işaretle.

## Store presence

- [ ] Main store listing (TR) — `bex/store-listing/play-store-tr.txt`
- [ ] (Opsiyonel) EN listing — `bex/store-listing/play-store-en.txt`
- [ ] App icon 512×512 — `bex/assets/icon.png`
- [ ] Phone screenshots min 2 — üret: `python bex/store-listing/screenshots/_generate.py` veya cihaz çekimi
- [ ] Privacy policy URL: https://passla.com.tr/gizlilik.html ✅ (200)
- [ ] Support email: destek@passla.com.tr

## App content

- [ ] Privacy policy linked (aynı URL)
- [ ] Ads declaration: **No ads**
- [ ] Content rating questionnaire (13+)
- [ ] Target audience (13+)
- [ ] Data safety — tablo: `PLAY_CONSOLE_INTERNAL_FORMS.md` § Veri güvenliği
- [ ] Account deletion: in-app + https://passla.com.tr/hesap-silme.html ✅ (200)

## Internal testing track

- [ ] Create **closed testing** release with AAB (**versionCode 9** / 1.0.2)
- [ ] Release notes: `bex/store-listing/INTERNAL_TEST_RELEASE_NOTES.txt`
- [ ] Add testers (email list)
- [ ] Review and roll out to internal testers

## Upload yöntemi

| Yöntem | Koşul |
|--------|--------|
| EAS submit | `bex/google-play-service-account.json` → `npm run submit:android` |
| Manuel | Dahili test → Yeni sürüm → AAB yükle |

Service account: [`PLAY_CONSOLE_SETUP.md`](PLAY_CONSOLE_SETUP.md) §5

## Repo / altyapı (referans)

- [x] API health UP — https://api.passla.com.tr/actuator/health
- [x] Yasal URL’ler 200 (gizlilik, hesap silme, destek, koşullar)
- [x] Production AAB build (vc 5)
- [ ] Play Console formları (sen)
- [ ] Internal release yayın (sen)
- [ ] Tester e-postaları (sen)
