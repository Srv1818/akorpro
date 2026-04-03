# Disaster Recovery — AkorPro

Siber olay, sızıntı veya yetkisiz erişim senaryoları için operasyonel adımlar: [security-incident-procedure.md](./security-incident-procedure.md).

## Yedekleme Stratejisi

**Firestore PITR (Point-in-Time Recovery)** kullanılır.

- Firebase Console → Firestore → Backups bölümünden PITR etkinleştirilir.
- PITR, son **7 gün** içinde herhangi bir dakikaya geri dönüş imkanı sağlar.
- Ek olarak **günlük otomatik export** Google Cloud Scheduler + `gcloud firestore export` ile bir Cloud Storage bucket'ına alınabilir (opsiyonel, gerektiğinde kurulur).

## Moderasyon Geri Alma

Bir şarkının moderasyon durumu yanlışlıkla değiştirilirse:

1. **Admin paneli** üzerinden ilgili şarkıyı bul → moderasyon durumunu eski haline (`approved` / `draft` / `pending`) çevir.
2. `admin_audit` koleksiyonu tüm moderasyon eylemlerini loglar; hangi admin'in ne zaman değiştirdiği buradan doğrulanabilir.
3. Toplu yanlış moderasyon durumunda: Firebase Console → Firestore → ilgili dokümanları manuel düzelt veya PITR ile belirli bir zaman noktasına geri dön.

## RTO / RPO Hedefleri

| Metrik | Hedef | Açıklama |
|--------|-------|----------|
| **RPO** (Recovery Point Objective) | **≤ 1 dakika** | PITR sayesinde son 1 dakikaya kadar olan veriye geri dönülebilir. |
| **RTO** (Recovery Time Objective) | **≤ 30 dakika** | PITR restore + cache revalidation + DNS propagation dahil toplam kurtarma süresi. |

> **Tek cümle özet:** PITR ile en fazla 1 dakikalık veri kaybı ve 30 dakika içinde tam kurtarma hedeflenir.

## Geri Yükleme Tatbikatı Adımları

1. Test ortamında PITR restore başlat (`gcloud firestore databases restore`).
2. Restore edilen veritabanında kritik koleksiyonları (`songs`, `users`, `artists`) doğrula.
3. Uygulama sunucusunu restore edilen DB'ye bağla, temel akışları (okuma, yazma, auth) test et.
4. Sonuçları ve süreyi dokümante et.
5. Tatbikat **her çeyrek (3 ayda bir)** tekrarlanır.
