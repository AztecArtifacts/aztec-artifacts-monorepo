CREATE TABLE "token_metadata_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "token_metadata_queue" ADD CONSTRAINT "token_metadata_queue_address_contract_instances_address_fk" FOREIGN KEY ("address") REFERENCES "public"."contract_instances"("address") ON DELETE no action ON UPDATE no action;