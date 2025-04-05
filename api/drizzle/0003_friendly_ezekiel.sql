CREATE TYPE "public"."nomination_status" AS ENUM('pending', 'rejected', 'accepted');--> statement-breakpoint
CREATE TABLE "nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "nomination_status" DEFAULT 'pending',
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "circle_wallet_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;