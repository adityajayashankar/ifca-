-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "isRecurring" SET DEFAULT E'none',
ALTER COLUMN "isRecurring" SET DATA TYPE TEXT;
