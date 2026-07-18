/*
  Warnings:

  - The values [USER,MOD,ADMIN] on the enum `ServerPermissions` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[server_id,name]` on the table `ServerRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role_id` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `server_id` to the `ServerRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServerPermissions_new" AS ENUM ('VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_SERVER', 'MANAGE_ROLES', 'INVITE_MEMBERS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADD_REACTIONS', 'USE_EMOJIS', 'ATTACH_FILES');
ALTER TABLE "ServerRole" ALTER COLUMN "permissions" TYPE "ServerPermissions_new"[] USING ("permissions"::text::"ServerPermissions_new"[]);
ALTER TYPE "ServerPermissions" RENAME TO "ServerPermissions_old";
ALTER TYPE "ServerPermissions_new" RENAME TO "ServerPermissions";
DROP TYPE "public"."ServerPermissions_old";
COMMIT;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "role_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ServerRole" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "server_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Participant_role_id_idx" ON "Participant"("role_id");

-- CreateIndex
CREATE INDEX "ServerRole_server_id_idx" ON "ServerRole"("server_id");

-- CreateIndex
CREATE INDEX "ServerRole_server_id_position_idx" ON "ServerRole"("server_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ServerRole_server_id_name_key" ON "ServerRole"("server_id", "name");

-- AddForeignKey
ALTER TABLE "ServerRole" ADD CONSTRAINT "ServerRole_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ServerRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
