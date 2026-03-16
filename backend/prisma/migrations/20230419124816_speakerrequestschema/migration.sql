/*
  Warnings:

  - You are about to drop the column `expertRequests` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expertRequests",
ADD COLUMN     "speakerRequests" JSONB[];
