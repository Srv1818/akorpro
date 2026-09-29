import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "editor_picks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"song_id" integer NOT NULL,
  	"position" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "editor_picks_id" integer;
  ALTER TABLE "editor_picks" ADD CONSTRAINT "editor_picks_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "editor_picks_song_idx" ON "editor_picks" USING btree ("song_id");
  CREATE INDEX "editor_picks_position_idx" ON "editor_picks" USING btree ("position");
  CREATE INDEX "editor_picks_updated_at_idx" ON "editor_picks" USING btree ("updated_at");
  CREATE INDEX "editor_picks_created_at_idx" ON "editor_picks" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_editor_picks_fk" FOREIGN KEY ("editor_picks_id") REFERENCES "public"."editor_picks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_editor_picks_id_idx" ON "payload_locked_documents_rels" USING btree ("editor_picks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "editor_picks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "editor_picks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_editor_picks_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_editor_picks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "editor_picks_id";`)
}
