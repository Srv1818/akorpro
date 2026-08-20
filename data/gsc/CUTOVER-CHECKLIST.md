# Kesim (cutover) URL Checklist — `akorpro.com.tr` → `akorpro.com`

> Otomatik üretildi: `node scripts/gsc-url-inventory.mjs`. Elle düzenleme.
> Kaynak: GSC Performance (son 3 ay) + GSC dizine ekleme + canlı sitemap.xml.

## Özet

| | |
|---|---|
| Trafik alan benzersiz path | **36** |
| Toplam tıklama / gösterim | 1348 / 117300 |
| Sitemap'teki URL | 178 |
| Google'ın dizine aldığı URL | **35** (sitemap'in %20'i) |
| Girilmesi zorunlu şarkı | **29** |
| Girilmesi zorunlu sanatçı | **27** |

Öncelik: **P0** = tıklamaların ilk %80'i (kesim öncesi %100 dolmalı) · **P1** = kalan tıklama alanlar · **P2** = yalnız gösterim.

## Zorunlu içerik — Directus'a kesimden ÖNCE girilecek

| Öncelik | Path | Tıklama | Gösterim | Dizinde | Girildi |
|---|---|--:|--:|:-:|:-:|
| P0 | `/akor/eypio/omrum` | 509 | 5948 | ✅ | ☐ |
| P0 | `/akor/ferdi-ozbegen/dilek-tasi` | 181 | 3661 | ✅ | ☐ |
| P0 | `/akor/karaf/ask-durdukca` | 147 | 6845 | ✅ | ☐ |
| P0 | `/akor/blok3/kusura-bakma` | 74 | 9526 | ✅ | ☐ |
| P0 | `/akor/dolu-kadehi-ters-tut/dilerim-ki` | 63 | 19418 | ✅ | ☐ |
| P0 | `/akor/mor-ve-otesi/cambaz` | 59 | 9550 | ✅ | ☐ |
| P1 | `/akor/sezen-aksu/yani` | 46 | 7959 | ✅ | ☐ |
| P1 | `/akor/ogun-sanlisoy/saydim` | 37 | 14055 | ✅ | ☐ |
| P1 | `/akor/sezen-aksu/sizli-bizli` | 36 | 170 | ✅ | ☐ |
| P1 | `/akor/umut-kaya/mor-yazma` | 33 | 8750 | ✅ | ☐ |
| P1 | `/akor/koray-avci/magusa-limani-akustik` | 25 | 3816 | ✅ | ☐ |
| P1 | `/akor/volkan-konak/izmir-marsi` | 24 | 3853 | ✅ | ☐ |
| P1 | `/akor/can-bonomo/bir-basina` | 19 | 400 | ✅ | ☐ |
| P1 | `/akor/baris-akarsu/islak-islak` | 18 | 8589 | ✅ | ☐ |
| P1 | `/akor/mehmet-gureli/kimse-bilmez` | 16 | 3355 | ✅ | ☐ |
| P1 | `/akor/duman/aman-aman` | 16 | 2338 | ✅ | ☐ |
| P1 | `/akor/baris-manco/kara-sevda` | 11 | 2946 | ✅ | ☐ |
| P1 | `/akor/sezen-aksu/ask-dansi` | 10 | 371 | ✅ | ☐ |
| P1 | `/akor/ahmet-kaya/agladikca` | 8 | 1074 | ✅ | ☐ |
| P1 | `/akor/anatolian-land/gonlun-var-mi-bende-sarmasik` | 3 | 308 | ✅ | ☐ |
| P1 | `/akor/rengin/aldatildik` | 2 | 2025 | ✅ | ☐ |
| P1 | `/akor/adamlar/acinin-ilaci` | 2 | 501 | ✅ | ☐ |
| P1 | `/akor/ankara-echoes/beni-al` | 1 | 161 | ✅ | ☐ |
| P1 | `/sanatci/eypio` | 1 | 132 | ✅ | ☐ |
| P1 | `/akor/ferhat-gocer-ve-nese-secil/askin-bana-verdigi-yetkiye` | 1 | 90 | ✅ | ☐ |
| P2 | `/akor/onur-can-ozcan/intiask` | 0 | 1164 | ✅ | ☐ |
| P2 | `/akor/semicenk/cikmaz-bir-sokakta` | 0 | 69 | ✅ | ☐ |
| P2 | `/akor/senay/hayat-bayram-olsa` | 0 | 60 | ✅ | ☐ |
| P2 | `/akor/duman/her-seyi-yak` | 0 | 17 | — | ☐ |
| P2 | `/akor/duman/senden-daha-guzel` | 0 | 11 | — | ☐ |
| P2 | `/sanatci/ferhat-gocer-ve-nese-secil` | 0 | 7 | ✅ | ☐ |
| P2 | `/sanatci/onur-can-ozcan` | 0 | 3 | ✅ | ☐ |
| P2 | `/sanatci/sertab-erener` | 0 | 2 | ✅ | ☐ |
| P2 | `/sanatci/athena` | 0 | 1 | ✅ | ☐ |

## Statik sayfalar (içerik gerektirmez, sadece 200 dönmeli)

| Öncelik | Path | Tıklama | Gösterim | Dizinde | Doğrulandı |
|---|---|--:|--:|:-:|:-:|
| P1 | `/` | 6 | 121 | ✅ | ☐ |

## Zorunlu sanatçı slug'ları (27)

- [ ] `adamlar`
- [ ] `ahmet-kaya`
- [ ] `anatolian-land`
- [ ] `ankara-echoes`
- [ ] `athena`
- [ ] `baris-akarsu`
- [ ] `baris-manco`
- [ ] `blok3`
- [ ] `can-bonomo`
- [ ] `dolu-kadehi-ters-tut`
- [ ] `duman`
- [ ] `eypio`
- [ ] `ferdi-ozbegen`
- [ ] `ferhat-gocer-ve-nese-secil`
- [ ] `karaf`
- [ ] `koray-avci`
- [ ] `mehmet-gureli`
- [ ] `mor-ve-otesi`
- [ ] `ogun-sanlisoy`
- [ ] `onur-can-ozcan`
- [ ] `rengin`
- [ ] `semicenk`
- [ ] `senay`
- [ ] `sertab-erener`
- [ ] `sezen-aksu`
- [ ] `umut-kaya`
- [ ] `volkan-konak`

## www yinelenmesi (kesimde düzeltilecek)

`www.akorpro.com.tr` ayrı dizine alınmış: **16 URL**, **75 tıklama**, **6760 gösterim** ayrı sayılıyor.
Yeni yığında `www.akorpro.com` → `akorpro.com` 301 zorunlu.

- `/akor/baris-akarsu/islak-islak`
- `/akor/blok3/kusura-bakma`
- `/akor/dolu-kadehi-ters-tut/dilerim-ki`
- `/akor/duman/aman-aman`
- `/akor/duman/her-seyi-yak`
- `/akor/duman/senden-daha-guzel`
- `/akor/eypio/omrum`
- `/akor/ferdi-ozbegen/dilek-tasi`
- `/akor/karaf/ask-durdukca`
- `/akor/kenan-dogulu/kursun-adres-sormaz-ki`
- `/akor/koray-avci/magusa-limani-akustik`
- `/akor/mehmet-gureli/kimse-bilmez`
- `/akor/mor-ve-otesi/cambaz`
- `/akor/ogun-sanlisoy/saydim`
- `/akor/rengin/aldatildik`
- `/akor/volkan-konak/izmir-marsi`

## Kapsam dışı bırakılanlar

- `/akor/kenan-dogulu/kursun-adres-sormaz-ki` (0 tıklama / 4 gösterim)
  - Karar (2026-08-20): kapsam dışı. 0 tıklama / 4 gösterim, pozisyon 54.5. Sitemap'te yok ve canlıda zaten soft 404 — gerçek içerik değil. İhtiyaç olursa yeni sitede normal içerik girişi olarak eklenir.

## Kör noktalar

- **Sitemap'te olup dizine alınmayan: 143 URL.** Bunlar zaten trafik almıyor; kesimde kaybedilecek bir şey yok, ama yeni yığında sitemap'in aynı URL'leri üretmesi beklenir.
- **Dizinde olup trafik almayan: 2 URL.** Yine de 200 dönmeli.
  - `/akor-kutuphanesi`
  - `/sanatci/ayten-alpman`
- **Trafik alıp sitemap'te olmayan: 1 URL.**
  - `/akor/kenan-dogulu/kursun-adres-sormaz-ki`
