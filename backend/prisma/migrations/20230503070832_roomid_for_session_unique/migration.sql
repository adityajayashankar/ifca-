/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_roomId_key" ON "Session"("roomId");
