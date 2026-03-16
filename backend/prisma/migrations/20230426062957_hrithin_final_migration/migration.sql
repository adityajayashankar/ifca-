/*
  Warnings:

  - Added the required column `sessionSlotId` to the `SessionOrderMapping` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionOrderMapping" ADD COLUMN     "sessionSlotId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SessionOrderMapping" ADD CONSTRAINT "SessionOrderMapping_sessionSlotId_fkey" FOREIGN KEY ("sessionSlotId") REFERENCES "SessionSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
