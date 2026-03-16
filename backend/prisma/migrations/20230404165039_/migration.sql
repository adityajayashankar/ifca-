/*
  Warnings:

  - You are about to drop the column `placedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_sessionId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "placedAt",
DROP COLUMN "sessionId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
