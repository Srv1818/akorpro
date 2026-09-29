// NOT: Üretici, tabloyu CASCADE ile düşürdükten sonra aynı kısıtlamayı
// tekrar düşürmeye çalışan SQL üretiyordu ve migration "constraint does not
// exist" ile patlıyordu. DROP ifadeleri IF EXISTS ile idempotent yapıldı.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "discover_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "discover_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "discover_sections" CASCADE;
  DROP TABLE "discover_items" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_discover_sections_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_discover_items_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_discover_sections_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_discover_items_id_idx";
  ALTER TABLE "songs" ALTER COLUMN "copyright_source" SET DEFAULT 'Topluluk Katkısı/Eğitim amaçlı';
  ALTER TABLE "artists" DROP COLUMN IF EXISTS "popularity";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "discover_sections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "discover_items_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "discover_sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "discover_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"section_id" integer NOT NULL,
  	"song_id" integer NOT NULL,
  	"position" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "songs" ALTER COLUMN "copyright_source" DROP DEFAULT;
  ALTER TABLE "artists" ADD COLUMN "popularity" numeric DEFAULT 0;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "discover_sections_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "discover_items_id" integer;
  ALTER TABLE "discover_items" ADD CONSTRAINT "discover_items_section_id_discover_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."discover_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "discover_items" ADD CONSTRAINT "discover_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "discover_sections_key_idx" ON "discover_sections" USING btree ("key");
  CREATE INDEX "discover_sections_updated_at_idx" ON "discover_sections" USING btree ("updated_at");
  CREATE INDEX "discover_sections_created_at_idx" ON "discover_sections" USING btree ("created_at");
  CREATE INDEX "discover_items_section_idx" ON "discover_items" USING btree ("section_id");
  CREATE INDEX "discover_items_song_idx" ON "discover_items" USING btree ("song_id");
  CREATE INDEX "discover_items_updated_at_idx" ON "discover_items" USING btree ("updated_at");
  CREATE INDEX "discover_items_created_at_idx" ON "discover_items" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discover_sections_fk" FOREIGN KEY ("discover_sections_id") REFERENCES "public"."discover_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discover_items_fk" FOREIGN KEY ("discover_items_id") REFERENCES "public"."discover_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_discover_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("discover_sections_id");
  CREATE INDEX "payload_locked_documents_rels_discover_items_id_idx" ON "payload_locked_documents_rels" USING btree ("discover_items_id");`)
}
