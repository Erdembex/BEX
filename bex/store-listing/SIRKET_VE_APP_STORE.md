# Şirket, Play üretimi, App Store

Sıra: kapalı test sayıları (`PILOT_METRIK.md`) dolmadan Ltd. kurma. Kişisel Play hesabı kapalı test için yeterli.

## Ne zaman Limited şirket

İlk fatura, yazılı sponsor sözleşmesi veya Apple Organization hesabı gerektiğinde.

- Ltd.: tek ortak olabilir. Mali müşavir, noter, ticaret sicili, vergi dairesi. Çoğu ilde birkaç hafta.
- Şahıs: daha ucuz; melek yatırım ve kurumsal sponsor için zayıf. Sadece “hemen fatura” ise ara adım.
- Sonra: kurumsal hesap, e-fatura, `passla.com.tr` ve destek@ şirket unvanına, KVKK metni unvanla güncellenir.

## D-U-N-S

Play kuruluş hesabı ve Apple Developer Organization Dun & Bradstreet numarası ister. Başvuru ücretsiz; dönüş günler veya haftalar. Şahıs hesabıyla kapalı teste devam; D-U-N-S’u şirket evrakı çıkınca iste.

## Play üretim

1. Kapalı testte en az 12 kişi 14 gün opt-in (`KAPALI_TEST_VC9.md`)
2. Play Console → üretim erişimi başvurusu
3. Aynı 1.0.2 (9) veya o turda biriken düzeltmelerle tek yeni AAB
4. Ülke: önce Türkiye
5. Önce kapalı testteki kayma ve çökme bitsin

## App Store (Play kapalı testi oturunca)

Metin taslağı: `app-store-tr.txt`

1. Apple Developer Program — Organization ise D-U-N-S + 99 USD/yıl
2. EAS production iOS build (`com.passla.app`)
3. Sertifika ve profil EAS’te
4. TestFlight dış test (ayrı inceleme)
5. Ekran görüntüsü 6.7" ve 6.5"
6. Gizlilik etiketi: e-posta, konum (kullanırken), fotoğraf, mesaj
7. Hesap silme: uygulama içi + https://passla.com.tr/hesap-silme.html
8. Ödeme: `BILLING_KARAR.md` — uygulama içi satış yok

iOS’u Android kapalı testi bitmeden başlatma. Aynı layout hatası iki mağazada tekrar eder.

## Sponsor (şirketten sonra, sayıdan sonra)

1. 10–20 işletme: 3 ay ücretsiz ilan, logo ve referans. Nakit değil.
2. Sunum: `PILOT_METRIK.md` tablosu dolu olsun.
3. Hibe (şirket şart): KOSGEB, TÜBİTAK 1512 / BİGG, teknopark.
4. Melek yatırım: 3 aylık metrikten sonra. Hisse öncesi mali müşavir.
