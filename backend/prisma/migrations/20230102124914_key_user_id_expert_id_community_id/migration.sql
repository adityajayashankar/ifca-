/*
  Warnings:

  - A unique constraint covering the columns `[userId,expertId,communityId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Subscription_expertId_key";

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_expertId_communityId_key" ON "Subscription"("userId", "expertId", "communityId");
