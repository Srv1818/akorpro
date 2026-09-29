import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "song_views" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"song_id" integer NOT NULL,
  	"day" varchar NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "song_views_id" integer;
  ALTER TABLE "song_views" ADD CONSTRAINT "song_views_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "song_views_song_idx" ON "song_views" USING btree ("song_id");
  CREATE INDEX "song_views_day_idx" ON "song_views" USING btree ("day");
  CREATE INDEX "song_views_updated_at_idx" ON "song_views" USING btree ("updated_at");
  CREATE INDEX "song_views_created_at_idx" ON "song_views" USING btree ("created_at");
  CREATE UNIQUE INDEX "song_day_idx" ON "song_views" USING btree ("song_id","day");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_song_views_fk" FOREIGN KEY ("song_views_id") REFERENCES "public"."song_views"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_song_views_id_idx" ON "payload_locked_documents_rels" USING btree ("song_views_id");
  ALTER TABLE "songs" DROP COLUMN IF EXISTS "popularity";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "song_views" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "song_views" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_song_views_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_song_views_id_idx";
  ALTER TABLE "songs" ADD COLUMN "popularity" numeric DEFAULT 0;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "song_views_id";`)
}
