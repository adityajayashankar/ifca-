/*
  Warnings:

  - Added the required column `isLive` to the `SessionSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionSlot" ADD COLUMN     "isLive" BOOLEAN NOT NULL;
