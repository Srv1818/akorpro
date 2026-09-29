import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "songs_meta_image_id_media_id_fk";
  
  ALTER TABLE "artists" DROP CONSTRAINT IF EXISTS "artists_meta_image_id_media_id_fk";
  
  DROP INDEX IF EXISTS "songs_meta_meta_image_idx";
  DROP INDEX IF EXISTS "artists_meta_meta_image_idx";
  ALTER TABLE "songs" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "songs" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "songs" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "artists" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "artists" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "artists" DROP COLUMN IF EXISTS "meta_image_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "songs" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "songs" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "songs" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "artists" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "artists" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "artists" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "songs" ADD CONSTRAINT "songs_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "songs_meta_meta_image_idx" ON "songs" USING btree ("meta_image_id");
  CREATE INDEX "artists_meta_meta_image_idx" ON "artists" USING btree ("meta_image_id");`)
}
