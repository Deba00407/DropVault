CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY,
	"name" text NOT NULL,
	"created_At" timestamp DEFAULT now(),
	"updated_At" timestamp DEFAULT now()
);
