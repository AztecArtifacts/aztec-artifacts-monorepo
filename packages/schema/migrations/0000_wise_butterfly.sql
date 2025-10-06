CREATE TABLE "artifact_selectors" (
	"contractClassId" text NOT NULL,
	"function_selector_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_selectors_contractClassId_function_selector_id_pk" PRIMARY KEY("contractClassId","function_selector_id")
);
--> statement-breakpoint
CREATE TABLE "contract_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"isToken" boolean,
	"artifactHash" text NOT NULL,
	"artifact" jsonb NOT NULL,
	"contractClassId" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_artifacts_artifactHash_unique" UNIQUE("artifactHash"),
	CONSTRAINT "contract_artifacts_contractClassId_unique" UNIQUE("contractClassId")
);
--> statement-breakpoint
CREATE TABLE "contract_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"salt" text NOT NULL,
	"deployer" text NOT NULL,
	"currentContractClassId" text NOT NULL,
	"originalContractClassId" text NOT NULL,
	"initializationHash" text NOT NULL,
	"publicKeys" jsonb NOT NULL,
	"initializationData" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_instances_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "function_selectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"selector" text NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text,
	"name" text,
	"decimals" smallint,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "artifact_selectors" ADD CONSTRAINT "artifact_selectors_contractClassId_contract_artifacts_contractClassId_fk" FOREIGN KEY ("contractClassId") REFERENCES "public"."contract_artifacts"("contractClassId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_selectors" ADD CONSTRAINT "artifact_selectors_function_selector_id_function_selectors_id_fk" FOREIGN KEY ("function_selector_id") REFERENCES "public"."function_selectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_currentContractClassId_contract_artifacts_contractClassId_fk" FOREIGN KEY ("currentContractClassId") REFERENCES "public"."contract_artifacts"("contractClassId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_instances" ADD CONSTRAINT "contract_instances_originalContractClassId_contract_artifacts_contractClassId_fk" FOREIGN KEY ("originalContractClassId") REFERENCES "public"."contract_artifacts"("contractClassId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_address_contract_instances_address_fk" FOREIGN KEY ("address") REFERENCES "public"."contract_instances"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "function_selectors_selector_signature_idx" ON "function_selectors" USING btree ("selector","signature");