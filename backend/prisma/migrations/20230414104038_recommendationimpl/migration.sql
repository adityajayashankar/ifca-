-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_sessionId_fkey";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "isVideoChannel" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SessionSlot" ADD COLUMN     "isRecorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoId" INTEGER;

-- CreateTable
CREATE TABLE "SpeakerRecommendation" (
    "id" SERIAL NOT NULL,
    "expertId" INTEGER NOT NULL,
    "recommendedTitle" TEXT NOT NULL DEFAULT E'Session Title',
    "recommendedDesc" TEXT NOT NULL DEFAULT E'Session desc',

    CONSTRAINT "SpeakerRecommendation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpeakerRecommendation" ADD CONSTRAINT "SpeakerRecommendation_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSlot" ADD CONSTRAINT "SessionSlot_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
