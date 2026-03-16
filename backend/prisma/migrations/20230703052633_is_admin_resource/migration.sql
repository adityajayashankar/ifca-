/*
  Warnings:

  - You are about to drop the column `communityId` on the `Resource` table. All the data in the column will be lost.
  - Added the required column `isAdmin` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_communityId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "communityId",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "_CommunityToResource" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommunityToResource_AB_unique" ON "_CommunityToResource"("A", "B");

-- CreateIndex
CREATE INDEX "_CommunityToResource_B_index" ON "_CommunityToResource"("B");

-- AddForeignKey
ALTER TABLE "_CommunityToResource" ADD CONSTRAINT "_CommunityToResource_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunityToResource" ADD CONSTRAINT "_CommunityToResource_B_fkey" FOREIGN KEY ("B") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
