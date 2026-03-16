/*
  Warnings:

  - Added the required column `sessionId` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_authorId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "link" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "EventAttendance" ALTER COLUMN "location" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "sessionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
