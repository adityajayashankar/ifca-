-- AlterTable
ALTER TABLE "Expert" ADD COLUMN     "sessionId" INTEGER;

-- AlterTable
ALTER TABLE "SessionSlot" ALTER COLUMN "location" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Expert" ADD CONSTRAINT "Expert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
