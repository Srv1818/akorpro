import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_songs_key_mode" AS ENUM('major', 'natural', 'harmonic', 'melodic');
  CREATE TYPE "public"."enum_songs_difficulty" AS ENUM('kolay', 'orta', 'zor');
  CREATE TYPE "public"."enum_songs_moderation_status" AS ENUM('draft', 'pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_contributions_key_mode" AS ENUM('major', 'natural', 'harmonic', 'melodic');
  CREATE TYPE "public"."enum_contributions_difficulty" AS ENUM('kolay', 'orta', 'zor');
  CREATE TYPE "public"."enum_contributions_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_takedown_requests_status" AS ENUM('pending', 'reviewing', 'resolved', 'rejected');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'publisher', 'moderator', 'contributor');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TABLE "songs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"title_initial" varchar,
  	"artist_id" integer NOT NULL,
  	"artist_slug" varchar,
  	"artist_name" varchar,
  	"chord_body" varchar NOT NULL,
  	"original_key" varchar NOT NULL,
  	"key_mode" "enum_songs_key_mode",
  	"gamlar_scale_id" varchar,
  	"difficulty" "enum_songs_difficulty" DEFAULT 'orta' NOT NULL,
  	"genre" varchar NOT NULL,
  	"tempo" varchar,
  	"time_signature" varchar,
  	"tuning" varchar,
  	"capo" numeric,
  	"show_harmony_details" boolean DEFAULT false,
  	"harmony_details_notes" varchar,
  	"moderation_status" "enum_songs_moderation_status" DEFAULT 'draft' NOT NULL,
  	"copyright_source" varchar,
  	"popularity" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"image_url" varchar,
  	"genre" varchar,
  	"popularity" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contributions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"song_title" varchar NOT NULL,
  	"artist_name" varchar NOT NULL,
  	"chord_body" varchar NOT NULL,
  	"original_key" varchar NOT NULL,
  	"key_mode" "enum_contributions_key_mode",
  	"genre" varchar NOT NULL,
  	"difficulty" "enum_contributions_difficulty" DEFAULT 'orta' NOT NULL,
  	"tempo" varchar,
  	"time_signature" varchar,
  	"tuning" varchar,
  	"capo" numeric,
  	"copyright_source" varchar,
  	"contributor_id" integer,
  	"contributor_display_name" varchar NOT NULL,
  	"status" "enum_contributions_status" DEFAULT 'pending' NOT NULL,
  	"moderator_id" integer,
  	"moderator_note" varchar,
  	"approved_song_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contributor_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"display_name" varchar NOT NULL,
  	"bio" varchar,
  	"avatar_url" varchar,
  	"verified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "song_contributors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"song_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chord_library" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"root" varchar NOT NULL,
  	"quality" varchar NOT NULL,
  	"fingering" varchar NOT NULL,
  	"fingers" varchar,
  	"barre_fret" numeric,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "scales" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"notes_c" jsonb,
  	"category" varchar,
  	"description" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  
  CREATE TABLE "playlists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "playlist_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"playlist_id" integer NOT NULL,
  	"song_id" integer NOT NULL,
  	"position" numeric DEFAULT 0 NOT NULL,
  	"transpose_semitones" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "takedown_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"song_url" varchar NOT NULL,
  	"original_work" varchar NOT NULL,
  	"proof" varchar NOT NULL,
  	"status" "enum_takedown_requests_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"role" "enum_users_role" DEFAULT 'contributor' NOT NULL,
  	"avatar_url" varchar,
  	"google_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'songs' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'songs' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"songs_id" integer,
  	"artists_id" integer,
  	"contributions_id" integer,
  	"contributor_profiles_id" integer,
  	"song_contributors_id" integer,
  	"chord_library_id" integer,
  	"scales_id" integer,
  	"discover_sections_id" integer,
  	"discover_items_id" integer,
  	"playlists_id" integer,
  	"playlist_items_id" integer,
  	"takedown_requests_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "songs" ADD CONSTRAINT "songs_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contributions" ADD CONSTRAINT "contributions_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contributions" ADD CONSTRAINT "contributions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contributions" ADD CONSTRAINT "contributions_approved_song_id_songs_id_fk" FOREIGN KEY ("approved_song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contributor_profiles" ADD CONSTRAINT "contributor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "song_contributors" ADD CONSTRAINT "song_contributors_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "song_contributors" ADD CONSTRAINT "song_contributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "discover_items" ADD CONSTRAINT "discover_items_section_id_discover_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."discover_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "discover_items" ADD CONSTRAINT "discover_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "playlists" ADD CONSTRAINT "playlists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_songs_fk" FOREIGN KEY ("songs_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contributions_fk" FOREIGN KEY ("contributions_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contributor_profiles_fk" FOREIGN KEY ("contributor_profiles_id") REFERENCES "public"."contributor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_song_contributors_fk" FOREIGN KEY ("song_contributors_id") REFERENCES "public"."song_contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chord_library_fk" FOREIGN KEY ("chord_library_id") REFERENCES "public"."chord_library"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scales_fk" FOREIGN KEY ("scales_id") REFERENCES "public"."scales"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discover_sections_fk" FOREIGN KEY ("discover_sections_id") REFERENCES "public"."discover_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discover_items_fk" FOREIGN KEY ("discover_items_id") REFERENCES "public"."discover_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_playlist_items_fk" FOREIGN KEY ("playlist_items_id") REFERENCES "public"."playlist_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_takedown_requests_fk" FOREIGN KEY ("takedown_requests_id") REFERENCES "public"."takedown_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "songs_title_idx" ON "songs" USING btree ("title");
  CREATE INDEX "songs_slug_idx" ON "songs" USING btree ("slug");
  CREATE INDEX "songs_title_initial_idx" ON "songs" USING btree ("title_initial");
  CREATE INDEX "songs_artist_idx" ON "songs" USING btree ("artist_id");
  CREATE INDEX "songs_artist_slug_idx" ON "songs" USING btree ("artist_slug");
  CREATE INDEX "songs_artist_name_idx" ON "songs" USING btree ("artist_name");
  CREATE INDEX "songs_genre_idx" ON "songs" USING btree ("genre");
  CREATE INDEX "songs_time_signature_idx" ON "songs" USING btree ("time_signature");
  CREATE INDEX "songs_moderation_status_idx" ON "songs" USING btree ("moderation_status");
  CREATE INDEX "songs_meta_meta_image_idx" ON "songs" USING btree ("meta_image_id");
  CREATE INDEX "songs_updated_at_idx" ON "songs" USING btree ("updated_at");
  CREATE INDEX "songs_created_at_idx" ON "songs" USING btree ("created_at");
  CREATE UNIQUE INDEX "artistSlug_slug_idx" ON "songs" USING btree ("artist_slug","slug");
  CREATE INDEX "artists_name_idx" ON "artists" USING btree ("name");
  CREATE UNIQUE INDEX "artists_slug_idx" ON "artists" USING btree ("slug");
  CREATE INDEX "artists_meta_meta_image_idx" ON "artists" USING btree ("meta_image_id");
  CREATE INDEX "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE INDEX "contributions_contributor_idx" ON "contributions" USING btree ("contributor_id");
  CREATE INDEX "contributions_status_idx" ON "contributions" USING btree ("status");
  CREATE INDEX "contributions_moderator_idx" ON "contributions" USING btree ("moderator_id");
  CREATE INDEX "contributions_approved_song_idx" ON "contributions" USING btree ("approved_song_id");
  CREATE INDEX "contributions_updated_at_idx" ON "contributions" USING btree ("updated_at");
  CREATE INDEX "contributions_created_at_idx" ON "contributions" USING btree ("created_at");
  CREATE UNIQUE INDEX "contributor_profiles_user_idx" ON "contributor_profiles" USING btree ("user_id");
  CREATE INDEX "contributor_profiles_updated_at_idx" ON "contributor_profiles" USING btree ("updated_at");
  CREATE INDEX "contributor_profiles_created_at_idx" ON "contributor_profiles" USING btree ("created_at");
  CREATE INDEX "song_contributors_song_idx" ON "song_contributors" USING btree ("song_id");
  CREATE INDEX "song_contributors_user_idx" ON "song_contributors" USING btree ("user_id");
  CREATE INDEX "song_contributors_updated_at_idx" ON "song_contributors" USING btree ("updated_at");
  CREATE INDEX "song_contributors_created_at_idx" ON "song_contributors" USING btree ("created_at");
  CREATE INDEX "chord_library_name_idx" ON "chord_library" USING btree ("name");
  CREATE INDEX "chord_library_root_idx" ON "chord_library" USING btree ("root");
  CREATE INDEX "chord_library_quality_idx" ON "chord_library" USING btree ("quality");
  CREATE INDEX "chord_library_updated_at_idx" ON "chord_library" USING btree ("updated_at");
  CREATE INDEX "chord_library_created_at_idx" ON "chord_library" USING btree ("created_at");
  CREATE UNIQUE INDEX "scales_key_idx" ON "scales" USING btree ("key");
  CREATE INDEX "scales_updated_at_idx" ON "scales" USING btree ("updated_at");
  CREATE INDEX "scales_created_at_idx" ON "scales" USING btree ("created_at");
  CREATE UNIQUE INDEX "discover_sections_key_idx" ON "discover_sections" USING btree ("key");
  CREATE INDEX "discover_sections_updated_at_idx" ON "discover_sections" USING btree ("updated_at");
  CREATE INDEX "discover_sections_created_at_idx" ON "discover_sections" USING btree ("created_at");
  CREATE INDEX "discover_items_section_idx" ON "discover_items" USING btree ("section_id");
  CREATE INDEX "discover_items_song_idx" ON "discover_items" USING btree ("song_id");
  CREATE INDEX "discover_items_updated_at_idx" ON "discover_items" USING btree ("updated_at");
  CREATE INDEX "discover_items_created_at_idx" ON "discover_items" USING btree ("created_at");
  CREATE INDEX "playlists_owner_idx" ON "playlists" USING btree ("owner_id");
  CREATE INDEX "playlists_updated_at_idx" ON "playlists" USING btree ("updated_at");
  CREATE INDEX "playlists_created_at_idx" ON "playlists" USING btree ("created_at");
  CREATE INDEX "playlist_items_playlist_idx" ON "playlist_items" USING btree ("playlist_id");
  CREATE INDEX "playlist_items_song_idx" ON "playlist_items" USING btree ("song_id");
  CREATE INDEX "playlist_items_updated_at_idx" ON "playlist_items" USING btree ("updated_at");
  CREATE INDEX "playlist_items_created_at_idx" ON "playlist_items" USING btree ("created_at");
  CREATE INDEX "takedown_requests_status_idx" ON "takedown_requests" USING btree ("status");
  CREATE INDEX "takedown_requests_updated_at_idx" ON "takedown_requests" USING btree ("updated_at");
  CREATE INDEX "takedown_requests_created_at_idx" ON "takedown_requests" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_songs_id_idx" ON "payload_locked_documents_rels" USING btree ("songs_id");
  CREATE INDEX "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX "payload_locked_documents_rels_contributions_id_idx" ON "payload_locked_documents_rels" USING btree ("contributions_id");
  CREATE INDEX "payload_locked_documents_rels_contributor_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("contributor_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_song_contributors_id_idx" ON "payload_locked_documents_rels" USING btree ("song_contributors_id");
  CREATE INDEX "payload_locked_documents_rels_chord_library_id_idx" ON "payload_locked_documents_rels" USING btree ("chord_library_id");
  CREATE INDEX "payload_locked_documents_rels_scales_id_idx" ON "payload_locked_documents_rels" USING btree ("scales_id");
  CREATE INDEX "payload_locked_documents_rels_discover_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("discover_sections_id");
  CREATE INDEX "payload_locked_documents_rels_discover_items_id_idx" ON "payload_locked_documents_rels" USING btree ("discover_items_id");
  CREATE INDEX "payload_locked_documents_rels_playlists_id_idx" ON "payload_locked_documents_rels" USING btree ("playlists_id");
  CREATE INDEX "payload_locked_documents_rels_playlist_items_id_idx" ON "payload_locked_documents_rels" USING btree ("playlist_items_id");
  CREATE INDEX "payload_locked_documents_rels_takedown_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("takedown_requests_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "songs" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "contributions" CASCADE;
  DROP TABLE "contributor_profiles" CASCADE;
  DROP TABLE "song_contributors" CASCADE;
  DROP TABLE "chord_library" CASCADE;
  DROP TABLE "scales" CASCADE;
  DROP TABLE "discover_sections" CASCADE;
  DROP TABLE "discover_items" CASCADE;
  DROP TABLE "playlists" CASCADE;
  DROP TABLE "playlist_items" CASCADE;
  DROP TABLE "takedown_requests" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_songs_key_mode";
  DROP TYPE "public"."enum_songs_difficulty";
  DROP TYPE "public"."enum_songs_moderation_status";
  DROP TYPE "public"."enum_contributions_key_mode";
  DROP TYPE "public"."enum_contributions_difficulty";
  DROP TYPE "public"."enum_contributions_status";
  DROP TYPE "public"."enum_takedown_requests_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
