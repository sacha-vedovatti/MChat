/*
  Warnings:

  - You are about to drop the column `is_group` on the `Channel` table. All the data in the column will be lost.
  - The primary key for the `Participant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `channel_id` on the `Participant` table. All the data in the column will be lost.
  - Added the required column `server_id` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `server_id` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServerPermissions" AS ENUM ('USER', 'MOD', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_channel_id_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "is_group",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "server_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_pkey",
DROP COLUMN "channel_id",
ADD COLUMN     "server_id" TEXT NOT NULL,
ADD CONSTRAINT "Participant_pkey" PRIMARY KEY ("server_id", "user_id");

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "ServerPermissions"[],

    CONSTRAINT "ServerRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Channel_server_id_idx" ON "Channel"("server_id");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
