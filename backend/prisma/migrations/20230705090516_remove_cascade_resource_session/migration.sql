-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_sessionId_fkey";

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
