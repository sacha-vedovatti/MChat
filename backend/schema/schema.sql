-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
-- Create enum type "UserRole"
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');
-- Create enum type "ServerPermissions"
CREATE TYPE "public"."ServerPermissions" AS ENUM ('VIEW_CHANNELS', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_SERVER', 'MANAGE_ROLES', 'INVITE_MEMBERS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADD_REACTIONS', 'USE_EMOJIS', 'ATTACH_FILES', 'OWNER', 'ADMIN');
-- Create "User" table
CREATE TABLE "public"."User" (
  "id" text NOT NULL,
  "email" text NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "avatar_url" text NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
  PRIMARY KEY ("id")
);
-- Create index "User_email_key" to table: "User"
CREATE UNIQUE INDEX "User_email_key" ON "public"."User" ("email");
-- Create "_prisma_migrations" table
CREATE TABLE "public"."_prisma_migrations" (
  "id" character varying(36) NOT NULL,
  "checksum" character varying(64) NOT NULL,
  "finished_at" timestamptz NULL,
  "migration_name" character varying(255) NOT NULL,
  "logs" text NULL,
  "rolled_back_at" timestamptz NULL,
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "applied_steps_count" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);
-- Create "_sqlx_migrations" table
CREATE TABLE "public"."_sqlx_migrations" (
  "version" bigint NOT NULL,
  "description" text NOT NULL,
  "installed_on" timestamptz NOT NULL DEFAULT now(),
  "success" boolean NOT NULL,
  "checksum" bytea NOT NULL,
  "execution_time" bigint NOT NULL,
  PRIMARY KEY ("version")
);
-- Create "Server" table
CREATE TABLE "public"."Server" (
  "id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" text NOT NULL,
  "owner_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "Server_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Create index "Server_owner_id_id_key" to table: "Server"
CREATE UNIQUE INDEX "Server_owner_id_id_key" ON "public"."Server" ("owner_id", "id");
-- Create index "Server_owner_id_idx" to table: "Server"
CREATE INDEX "Server_owner_id_idx" ON "public"."Server" ("owner_id");
-- Create "Channel" table
CREATE TABLE "public"."Channel" (
  "id" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" text NULL,
  "server_id" text NOT NULL,
  "name" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "Channel_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "public"."Server" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Create index "Channel_server_id_idx" to table: "Channel"
CREATE INDEX "Channel_server_id_idx" ON "public"."Channel" ("server_id");
-- Create "Message" table
CREATE TABLE "public"."Message" (
  "id" text NOT NULL,
  "channel_id" text NOT NULL,
  "sender_id" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "Message_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."Channel" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Create index "Message_channel_id_idx" to table: "Message"
CREATE INDEX "Message_channel_id_idx" ON "public"."Message" ("channel_id");
-- Create index "Message_sender_id_idx" to table: "Message"
CREATE INDEX "Message_sender_id_idx" ON "public"."Message" ("sender_id");
-- Create "ServerRole" table
CREATE TABLE "public"."ServerRole" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "color" text NOT NULL DEFAULT '#99AAB5',
  "permissions" "public"."ServerPermissions"[] NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_default" boolean NOT NULL DEFAULT false,
  "position" integer NOT NULL DEFAULT 0,
  "server_id" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "ServerRole_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "public"."Server" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Create index "ServerRole_server_id_idx" to table: "ServerRole"
CREATE INDEX "ServerRole_server_id_idx" ON "public"."ServerRole" ("server_id");
-- Create index "ServerRole_server_id_name_key" to table: "ServerRole"
CREATE UNIQUE INDEX "ServerRole_server_id_name_key" ON "public"."ServerRole" ("server_id", "name");
-- Create index "ServerRole_server_id_position_idx" to table: "ServerRole"
CREATE INDEX "ServerRole_server_id_position_idx" ON "public"."ServerRole" ("server_id", "position");
-- Create "ServerUser" table
CREATE TABLE "public"."ServerUser" (
  "server_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role_id" integer NULL,
  "joined_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("server_id", "user_id"),
  CONSTRAINT "ServerUser_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."ServerRole" ("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "ServerUser_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "public"."Server" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "ServerUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Create index "ServerUser_role_id_idx" to table: "ServerUser"
CREATE INDEX "ServerUser_role_id_idx" ON "public"."ServerUser" ("role_id");
-- Create index "ServerUser_user_id_idx" to table: "ServerUser"
CREATE INDEX "ServerUser_user_id_idx" ON "public"."ServerUser" ("user_id");
