/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Resource` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_sessionId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "sessionId";

-- CreateTable
CREATE TABLE "_ResourceToSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ResourceToSession_AB_unique" ON "_ResourceToSession"("A", "B");

-- CreateIndex
CREATE INDEX "_ResourceToSession_B_index" ON "_ResourceToSession"("B");

-- AddForeignKey
ALTER TABLE "_ResourceToSession" ADD CONSTRAINT "_ResourceToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToSession" ADD CONSTRAINT "_ResourceToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
