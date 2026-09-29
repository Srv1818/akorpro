import { sql } from 'drizzle-orm'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * akorpro.com.tr'deki 70 sanatçıyı taşır.
 *
 * Neden migration: panelin içe aktarma eklentisi "Something went wrong" ile
 * takıldı. Migration dosya yüklemeye, eklentiye ve kimlik bilgisine ihtiyaç
 * duymuyor; deploy'da kendiliğinden çalışıyor ve sürüm kontrolünde duruyor.
 *
 * Slug'lar UYDURULMADI: .com.tr sitemap'inden okundu ve slugify çıktısıyla
 * 70/70 eşleştiği doğrulandı. Eski adresler birebir korunuyor.
 *
 * ON CONFLICT DO NOTHING: tekrar çalışsa kopya üretmez, elle girilmiş
 * kaydın üstüne yazmaz.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO artists (name, slug, genre, updated_at, created_at)
    VALUES
    ('Adamlar', 'adamlar', 'Rock', now(), now()),
    ('Ahmet Kaya', 'ahmet-kaya', 'Halk Müziği', now(), now()),
    ('Ajda Pekkan', 'ajda-pekkan', 'Pop', now(), now()),
    ('Anatolian Land', 'anatolian-land', 'Pop', now(), now()),
    ('Ankara Echoes', 'ankara-echoes', 'Pop', now(), now()),
    ('Âşık Veysel', 'asik-veysel', 'Halk Müziği', now(), now()),
    ('Athena', 'athena', 'Rock', now(), now()),
    ('Ayten Alpman', 'ayten-alpman', 'Pop', now(), now()),
    ('Barış Akarsu', 'baris-akarsu', 'Rock', now(), now()),
    ('Barış Manço', 'baris-manco', 'Rock', now(), now()),
    ('Blok3', 'blok3', 'Pop', now(), now()),
    ('Can Bonomo', 'can-bonomo', 'Rock', now(), now()),
    ('Can Ozan', 'can-ozan', 'Pop', now(), now()),
    ('Cem Karaca', 'cem-karaca', 'Rock', now(), now()),
    ('Dolu Kadehi Ters Tut', 'dolu-kadehi-ters-tut', 'Rock', now(), now()),
    ('Duman', 'duman', 'Rock', now(), now()),
    ('Evdeki Saat', 'evdeki-saat', 'Pop', now(), now()),
    ('Eypio', 'eypio', 'Pop', now(), now()),
    ('Ferdi Özbeğen', 'ferdi-ozbegen', 'Pop', now(), now()),
    ('Ferhat Göçer ve Neşe Seçil', 'ferhat-gocer-ve-nese-secil', 'Pop', now(), now()),
    ('Fikret Kızılok', 'fikret-kizilok', 'Rock', now(), now()),
    ('Gripin', 'gripin', 'Rock', now(), now()),
    ('Haluk Levent', 'haluk-levent', 'Rock', now(), now()),
    ('Haramiler', 'haramiler', 'Rock', now(), now()),
    ('İkilem & Tuğba', 'ikilem-ve-tugba', 'Pop', now(), now()),
    ('İlyas Yalçıntaş', 'ilyas-yalcintas', 'Pop', now(), now()),
    ('Irem', 'irem', 'Pop', now(), now()),
    ('Kaan Tangöze', 'kaan-tangoze', 'Rock', now(), now()),
    ('Kalben', 'kalben', 'Pop', now(), now()),
    ('Karaf', 'karaf', 'Pop', now(), now()),
    ('Kargo', 'kargo', 'Rock', now(), now()),
    ('Kenan Doğulu', 'kenan-dogulu', 'Pop', now(), now()),
    ('Koray Avcı', 'koray-avci', 'Pop', now(), now()),
    ('Levent Yüksel', 'levent-yuksel', 'Pop', now(), now()),
    ('maNga', 'manga', 'Rock', now(), now()),
    ('Mazhar Alanson', 'mazhar-alanson', 'Rock', now(), now()),
    ('Mehmet Güreli', 'mehmet-gureli', 'Pop', now(), now()),
    ('Mert Demir', 'mert-demir', 'Pop', now(), now()),
    ('Model', 'model', 'Rock', now(), now()),
    ('Mor ve Ötesi', 'mor-ve-otesi', 'Rock', now(), now()),
    ('Nilüfer', 'nilufer', 'Pop', now(), now()),
    ('Ogün Sanlısoy', 'ogun-sanlisoy', 'Rock', now(), now()),
    ('Oğuzhan Koç', 'oguzhan-koc', 'Pop', now(), now()),
    ('Onur Can Özcan', 'onur-can-ozcan', 'Pop', now(), now()),
    ('Pilli Bebek', 'pilli-bebek', 'Rock', now(), now()),
    ('Pinhani', 'pinhani', 'Rock', now(), now()),
    ('Rengin', 'rengin', 'Pop', now(), now()),
    ('Rıza Tamer', 'riza-tamer', 'Pop', now(), now()),
    ('Rıza Tamer', 'riza-tamer', 'Pop', now(), now()),
    ('Saip Egüz', 'saip-eguz', 'Pop', now(), now()),
    ('Şebnem Ferah', 'sebnem-ferah', 'Rock', now(), now()),
    ('Sefa Topsakal', 'sefa-topsakal', 'Pop', now(), now()),
    ('Seksendört', 'seksendort', 'Rock', now(), now()),
    ('Seksendört', 'seksendort', 'Rock', now(), now()),
    ('Semicenk', 'semicenk', 'Pop', now(), now()),
    ('Şenay', 'senay', 'Pop', now(), now()),
    ('Serkan Nişancı', 'serkan-nisanci', 'Pop', now(), now()),
    ('Sertab Erener', 'sertab-erener', 'Pop', now(), now()),
    ('Sezen Aksu', 'sezen-aksu', 'Pop', now(), now()),
    ('Teoman', 'teoman', 'Rock', now(), now()),
    ('Tuana', 'tuana', 'Pop', now(), now()),
    ('Ufuk Beydemir', 'ufuk-beydemir', 'Pop', now(), now()),
    ('Umut Kaya', 'umut-kaya', 'Rock', now(), now()),
    ('Umut Kaya', 'umut-kaya', 'Rock', now(), now()),
    ('Volkan Konak', 'volkan-konak', 'Pop', now(), now()),
    ('Yalın', 'yalin', 'Pop', now(), now()),
    ('Yaşar', 'yasar', 'Pop', now(), now()),
    ('Yeni Türkü', 'yeni-turku', 'Pop', now(), now()),
    ('Yüzyüzeyken Konuşuruz', 'yuzyuzeyken-konusuruz', 'Rock', now(), now()),
    ('Zeynep Bastık', 'zeynep-bastik', 'Pop', now(), now())
    ON CONFLICT (slug) DO NOTHING
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Yalnız bu göçle gelen slug'lar silinir; sonradan elle eklenenler kalır.
  await db.execute(sql`
    DELETE FROM artists WHERE slug IN ('adamlar', 'ahmet-kaya', 'ajda-pekkan', 'anatolian-land', 'ankara-echoes', 'asik-veysel', 'athena', 'ayten-alpman', 'baris-akarsu', 'baris-manco', 'blok3', 'can-bonomo', 'can-ozan', 'cem-karaca', 'dolu-kadehi-ters-tut', 'duman', 'evdeki-saat', 'eypio', 'ferdi-ozbegen', 'ferhat-gocer-ve-nese-secil', 'fikret-kizilok', 'gripin', 'haluk-levent', 'haramiler', 'ikilem-ve-tugba', 'ilyas-yalcintas', 'irem', 'kaan-tangoze', 'kalben', 'karaf', 'kargo', 'kenan-dogulu', 'koray-avci', 'levent-yuksel', 'manga', 'mazhar-alanson', 'mehmet-gureli', 'mert-demir', 'model', 'mor-ve-otesi', 'nilufer', 'ogun-sanlisoy', 'oguzhan-koc', 'onur-can-ozcan', 'pilli-bebek', 'pinhani', 'rengin', 'riza-tamer', 'riza-tamer', 'saip-eguz', 'sebnem-ferah', 'sefa-topsakal', 'seksendort', 'seksendort', 'semicenk', 'senay', 'serkan-nisanci', 'sertab-erener', 'sezen-aksu', 'teoman', 'tuana', 'ufuk-beydemir', 'umut-kaya', 'umut-kaya', 'volkan-konak', 'yalin', 'yasar', 'yeni-turku', 'yuzyuzeyken-konusuruz', 'zeynep-bastik')
  `)
}
