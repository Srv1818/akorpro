import { sql } from 'drizzle-orm'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * .com.tr'den taşınan şarkılarda kalan biçim tutarsızlıklarını temizler.
 *
 * Üç şey düzeltiliyor:
 *
 * 1. Başlık sonundaki boşluk — 17 kayıtta vardı ("Kara Sevda ", "Mor Yazma ").
 *    Göze çarpmıyor ama başlık sayfa `<title>`'ına, yapısal veriye ve
 *    paylaşım kartlarına birebir giriyor.
 *
 * 2. Tür yazımı — aynı tür üç farklı şekilde yazılmıştı: Pop/POP/pop ve
 *    Rock/ROCK. Tür alanı filtrede `getFilteredSongs({ tur })` ile birebir
 *    eşleştiriliyor, yani "POP" yazan şarkı "Pop" filtresine düşmüyordu.
 *    Yalnız BÜYÜK/küçük harf düzeltiliyor; "Türkü" ile "Türk Halk Müziği"
 *    birleştirilmedi, o bir içerik kararı.
 *
 * 3. Boş ton modu — iki kayıtta taşımada düşmüştü. Değerler TAHMİN
 *    EDİLMEDİ, .com.tr'deki karşılıklarından okundu: Yüzük "C Harmonik
 *    Minör", Kusura Bakma "D Majör".
 *
 *    İlk taslakta `originalKey`'den tahmin ediliyordu; o kural yanlıştı ve
 *    sınamada yakalandı. `originalKey` yalnız kök notayı tutuyor ("Am"
 *    yazılsa bile "A" olarak saklanıyor, bkz. `splitOriginalKey`), yani
 *    metinde minör ipucu kalmıyor ve kural her şeyi majör işaretliyordu.
 *
 * Hepsi idempotent: tekrar çalışırsa değişecek satır bulamaz.
 *
 * Tekrarı önleme: başlık/tür boşluk kırpması artık Songs koleksiyonunun
 * `beforeValidate` hook'unda da yapılıyor, yani yeni kayıtlarda oluşmuyor.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1) Metin alanlarının başındaki/sonundaki boşluk
  await db.execute(sql`
    UPDATE songs
    SET title = btrim(title)
    WHERE title <> btrim(title)
  `)

  await db.execute(sql`
    UPDATE songs
    SET genre = btrim(genre)
    WHERE genre <> btrim(genre)
  `)

  await db.execute(sql`
    UPDATE artists
    SET name = btrim(name)
    WHERE name <> btrim(name)
  `)

  // artistName şarkıda denormalize tutuluyor; sanatçıyla aynı kalmalı.
  await db.execute(sql`
    UPDATE songs
    SET artist_name = btrim(artist_name)
    WHERE artist_name IS NOT NULL AND artist_name <> btrim(artist_name)
  `)

  // 2) Tür yazımı — yalnız harf büyüklüğü
  await db.execute(sql`
    UPDATE songs SET genre = 'Pop'  WHERE genre <> 'Pop'  AND lower(genre) = 'pop'
  `)
  await db.execute(sql`
    UPDATE songs SET genre = 'Rock' WHERE genre <> 'Rock' AND lower(genre) = 'rock'
  `)

  /**
   * 3) Taşımada düşen ton modları. Slug ile hedefleniyor ve yalnız boşsa
   * yazılıyor; elle düzeltilmişse üstüne gitmez.
   */
  await db.execute(sql`
    UPDATE songs SET key_mode = 'harmonic'::enum_songs_key_mode
    WHERE key_mode IS NULL AND artist_slug = 'oguzhan-koc' AND slug = 'yuzuk'
  `)
  await db.execute(sql`
    UPDATE songs SET key_mode = 'major'::enum_songs_key_mode
    WHERE key_mode IS NULL AND artist_slug = 'blok3' AND slug = 'kusura-bakma'
  `)
}

/**
 * Geri alınamaz ve alınmamalı: kırpılan boşluğun ve düzeltilen harf
 * büyüklüğünün eski hali kayıtlı değil. Zaten hiçbiri veri kaybı değil,
 * geri döndürülecek bir şey yok.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1`)
}
