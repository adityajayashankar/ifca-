/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `Resource` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_authorId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "isAdmin";

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
