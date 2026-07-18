/*
  Warnings:

  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[owner_id,id]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `owner_id` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServerPermissions" ADD VALUE 'OWNER';
ALTER TYPE "ServerPermissions" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_role_id_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_server_id_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_user_id_fkey";

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "owner_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "Participant";

-- CreateTable
CREATE TABLE "ServerUser" (
    "server_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerUser_pkey" PRIMARY KEY ("server_id","user_id")
);

-- CreateIndex
CREATE INDEX "ServerUser_user_id_idx" ON "ServerUser"("user_id");

-- CreateIndex
CREATE INDEX "ServerUser_role_id_idx" ON "ServerUser"("role_id");

-- CreateIndex
CREATE INDEX "Server_owner_id_idx" ON "Server"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "Server_owner_id_id_key" ON "Server"("owner_id", "id");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerUser" ADD CONSTRAINT "ServerUser_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerUser" ADD CONSTRAINT "ServerUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerUser" ADD CONSTRAINT "ServerUser_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ServerRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
