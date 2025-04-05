ALTER TYPE "public"."transaction_type" ADD VALUE 'pay_request';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "destination_address" varchar(255) NOT NULL;