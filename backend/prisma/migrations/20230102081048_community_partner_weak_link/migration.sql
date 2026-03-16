-- AlterTable
ALTER TABLE "Community" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "creatorId" DROP NOT NULL;
