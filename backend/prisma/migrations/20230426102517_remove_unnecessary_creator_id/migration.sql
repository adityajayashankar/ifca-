/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Community` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_creatorId_fkey";

-- AlterTable
ALTER TABLE "Community" DROP COLUMN "creatorId",
ADD COLUMN     "partnerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
