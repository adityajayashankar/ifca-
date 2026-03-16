/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Expert` table. All the data in the column will be lost.
  - You are about to drop the column `expertRequestIds` on the `Session` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Expert" DROP CONSTRAINT "Expert_sessionId_fkey";

-- AlterTable
ALTER TABLE "Expert" DROP COLUMN "sessionId";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expertRequestIds",
ADD COLUMN     "expertRequests" JSONB[];
