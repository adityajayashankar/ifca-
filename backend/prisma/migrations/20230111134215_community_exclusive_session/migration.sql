-- DropIndex
DROP INDEX "Session_title_key";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "communityId" INTEGER,
ADD COLUMN     "isExclusive" BOOLEAN NOT NULL DEFAULT false;
