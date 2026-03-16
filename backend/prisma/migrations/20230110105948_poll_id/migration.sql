/*
  Warnings:

  - Added the required column `postId` to the `UserPollOptionSelect` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserPollOptionSelect" ADD COLUMN     "postId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UserPollOptionSelect" ADD CONSTRAINT "UserPollOptionSelect_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
