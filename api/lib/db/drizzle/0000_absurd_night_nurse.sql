CREATE TABLE IF NOT EXISTS "peeple_api_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"likerid" varchar(21) NOT NULL,
	"likedid" varchar(21) NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peeple_api_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1id" varchar(21) NOT NULL,
	"user2id" varchar(21) NOT NULL,
	"matchedat" timestamp DEFAULT now() NOT NULL,
	"isactive" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peeple_api_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"matchid" integer NOT NULL,
	"senderid" varchar(21) NOT NULL,
	"content" text NOT NULL,
	"sentat" timestamp DEFAULT now() NOT NULL,
	"isread" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peeple_api_pictures" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" varchar(21) NOT NULL,
	"url" varchar(255) NOT NULL,
	"isprimary" boolean DEFAULT false,
	"uploadedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peeple_api_userpreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" varchar(21) NOT NULL,
	"agerange" jsonb,
	"genderpreference" jsonb,
	"relationshiptypepreference" jsonb,
	"maxdistance" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peeple_api_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar,
	"email" varchar(255) NOT NULL,
	"location" varchar(255),
	"gender" varchar,
	"relationshiptype" varchar,
	"height" integer,
	"religion" varchar,
	"occupation_field" varchar(255),
	"occupation_area" varchar,
	"drink" varchar,
	"smoke" varchar,
	"bio" text,
	"date" integer,
	"month" integer,
	"year" integer,
	"subscription" varchar,
	CONSTRAINT "peeple_api_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_likes" ADD CONSTRAINT "peeple_api_likes_likerid_peeple_api_users_id_fk" FOREIGN KEY ("likerid") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_likes" ADD CONSTRAINT "peeple_api_likes_likedid_peeple_api_users_id_fk" FOREIGN KEY ("likedid") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_matches" ADD CONSTRAINT "peeple_api_matches_user1id_peeple_api_users_id_fk" FOREIGN KEY ("user1id") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_matches" ADD CONSTRAINT "peeple_api_matches_user2id_peeple_api_users_id_fk" FOREIGN KEY ("user2id") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_messages" ADD CONSTRAINT "peeple_api_messages_matchid_peeple_api_matches_id_fk" FOREIGN KEY ("matchid") REFERENCES "public"."peeple_api_matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_messages" ADD CONSTRAINT "peeple_api_messages_senderid_peeple_api_users_id_fk" FOREIGN KEY ("senderid") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_pictures" ADD CONSTRAINT "peeple_api_pictures_userid_peeple_api_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peeple_api_userpreferences" ADD CONSTRAINT "peeple_api_userpreferences_userid_peeple_api_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."peeple_api_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
