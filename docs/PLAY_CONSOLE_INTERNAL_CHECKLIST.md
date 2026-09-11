# Play Console — Internal Test Checklist (com.passla.app)

Her maddeyi Play Console'da işaretle.

## Store presence

- [ ] Main store listing (TR) — metin: `bex/store-listing/play-store-tr.txt`
- [ ] App icon 512×512 — `bex/assets/icon.png`
- [ ] Phone screenshots min 2 — `bex/store-listing/screenshots/`
- [ ] Privacy policy URL: https://passla.com.tr/gizlilik.html
- [ ] Support email: destek@passla.com.tr

## App content

- [ ] Privacy policy linked
- [ ] Ads declaration (No ads if applicable)
- [ ] Content rating questionnaire (13+)
- [ ] Target audience
- [ ] Data safety: location, camera, photos, messages, account data
- [ ] Account deletion: in-app + https://passla.com.tr/hesap-silme.html

## Internal testing track

- [ ] Create release with AAB (versionCode 4 / 1.0.2)
- [ ] Release notes: `bex/store-listing/INTERNAL_TEST_RELEASE_NOTES.txt`
- [ ] Add testers (email list)
- [ ] Review and roll out to internal testers

## Upload yöntemi

| Yöntem | Koşul |
|--------|--------|
| EAS submit | `bex/google-play-service-account.json` mevcut → `npm run submit:android` |
| Manuel | Play Console → Internal testing → Upload AAB |

Service account kurulum: [`PLAY_CONSOLE_SETUP.md`](PLAY_CONSOLE_SETUP.md) §5
