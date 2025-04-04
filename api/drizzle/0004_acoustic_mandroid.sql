ALTER TABLE "users" ALTER COLUMN "wallet_address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;