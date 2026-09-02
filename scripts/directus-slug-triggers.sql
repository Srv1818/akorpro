-- Otomatik slug üretimi ve denormalize alan doldurma — Postgres trigger'ları.
--
-- Neden Directus Flow değil: bu kurulumda `filter` tipi flow'lar tetiklenmiyor
-- (sabit değer yazan en basit exec bile etkisiz kaldı; Directus yeniden
-- başlatılarak da denendi). Trigger yaklaşımı Directus'un iç işleyişine bağlı
-- değil ve her yazma yolunda çalışır: admin UI, REST/GraphQL, toplu import.
--
-- Uygulama:
--   docker exec $(docker ps -qf name=postgresql-b11cb2j) \
--     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < scripts/directus-slug-triggers.sql
--
-- Idempotent: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.

-- ---------------------------------------------------------------------------
-- Türkçe duyarlı slugify
-- ---------------------------------------------------------------------------
-- translate() lower()'dan ÖNCE çalışır: Postgres'in lower()'ı "İ" ve "I" için
-- Türkçe kurallarını uygulamaz, "ı" da ASCII'ye düşmez.
CREATE OR REPLACE FUNCTION akorpro_slugify(value text) RETURNS text AS $$
  SELECT left(
    btrim(
      regexp_replace(
        lower(
          translate(
            coalesce(value, ''),
            'ıİşŞğĞüÜöÖçÇâÂîÎûÛ',
            'iissgguuooccaaiiuu'
          )
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-'
    ),
    120
  );
$$ LANGUAGE sql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- artists: slug ← name
-- ---------------------------------------------------------------------------
-- INSERT'te slug her zaman isimden türetilir; alana ne yazılmış olursa olsun.
-- (İlk içerik denemesinde slug alanına tam URL yapıştırılmıştı.)
-- UPDATE'te elle verilmiş slug korunur, yalnız biçimi temizlenir.
CREATE OR REPLACE FUNCTION akorpro_artists_slug() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := akorpro_slugify(NEW.name);
  ELSE
    NEW.slug := akorpro_slugify(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS akorpro_artists_slug_trg ON artists;
CREATE TRIGGER akorpro_artists_slug_trg
  BEFORE INSERT OR UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION akorpro_artists_slug();

-- ---------------------------------------------------------------------------
-- songs: slug ← title, artist_slug/artist_name ← ilişkili sanatçı
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION akorpro_songs_slug() RETURNS trigger AS $$
DECLARE
  a RECORD;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := akorpro_slugify(NEW.title);
  ELSE
    NEW.slug := akorpro_slugify(NEW.slug);
  END IF;

  -- Denormalize alanlar tek kaynaktan doldurulur; elle yazılmasına gerek yok.
  IF NEW.artist IS NOT NULL THEN
    SELECT slug, name INTO a FROM artists WHERE id = NEW.artist;
    IF FOUND THEN
      NEW.artist_slug := a.slug;
      NEW.artist_name := a.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS akorpro_songs_slug_trg ON songs;
CREATE TRIGGER akorpro_songs_slug_trg
  BEFORE INSERT OR UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION akorpro_songs_slug();

-- ---------------------------------------------------------------------------
-- Sanatçı adı/slug'ı değişirse şarkılardaki kopyalar da güncellensin
-- ---------------------------------------------------------------------------
-- Denormalize alanların sessizce eskimesini önler: sanatçı adı düzeltilince
-- şarkı kayıtları eski adı taşımaya devam etmez.
CREATE OR REPLACE FUNCTION akorpro_artists_propagate() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug OR NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE songs
       SET artist_slug = NEW.slug,
           artist_name = NEW.name
     WHERE artist = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS akorpro_artists_propagate_trg ON artists;
CREATE TRIGGER akorpro_artists_propagate_trg
  AFTER UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION akorpro_artists_propagate();

-- ---------------------------------------------------------------------------
-- Mevcut kayıtları bir kez normalize et
-- ---------------------------------------------------------------------------
UPDATE artists SET slug = akorpro_slugify(name) WHERE slug IS NULL OR slug <> akorpro_slugify(slug);
UPDATE songs s
   SET artist_slug = a.slug,
       artist_name = a.name
  FROM artists a
 WHERE s.artist = a.id
   AND (s.artist_slug IS DISTINCT FROM a.slug OR s.artist_name IS DISTINCT FROM a.name);
