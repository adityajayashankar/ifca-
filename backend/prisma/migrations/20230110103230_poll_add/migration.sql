-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isPoll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pollExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PollOptions" (
    "id" SERIAL NOT NULL,
    "option" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "PollOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPollOptionSelect" (
    "id" SERIAL NOT NULL,
    "unifiedUserId" INTEGER NOT NULL,
    "pollOptionsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPollOptionSelect_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PollOptions" ADD CONSTRAINT "PollOptions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPollOptionSelect" ADD CONSTRAINT "UserPollOptionSelect_unifiedUserId_fkey" FOREIGN KEY ("unifiedUserId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPollOptionSelect" ADD CONSTRAINT "UserPollOptionSelect_pollOptionsId_fkey" FOREIGN KEY ("pollOptionsId") REFERENCES "PollOptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
