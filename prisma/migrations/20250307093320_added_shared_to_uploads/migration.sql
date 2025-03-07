/*
  Warnings:

  - You are about to drop the column `Shared` on the `Uploads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Uploads" DROP COLUMN "Shared",
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;
