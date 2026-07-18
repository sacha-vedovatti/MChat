/*
  Warnings:

  - You are about to drop the column `is_group` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Server` table. All the data in the column will be lost.
  - Added the required column `name` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" DROP COLUMN "is_group",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;
