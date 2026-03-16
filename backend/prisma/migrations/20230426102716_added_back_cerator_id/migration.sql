/*
  Warnings:

  - You are about to drop the column `partnerId` on the `Community` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_partnerId_fkey";

-- AlterTable
ALTER TABLE "Community" DROP COLUMN "partnerId",
ADD COLUMN     "creatorId" INTEGER;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
