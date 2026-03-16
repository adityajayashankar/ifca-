/*
  Warnings:

  - You are about to drop the column `adminId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `communityId` on the `Video` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[expertId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_communityId_fkey";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "adminId",
DROP COLUMN "communityId",
ADD COLUMN     "sessionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_expertId_key" ON "Subscription"("expertId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
