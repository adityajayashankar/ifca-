-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SessionSlot" ADD COLUMN     "topicName" TEXT NOT NULL DEFAULT E'';
