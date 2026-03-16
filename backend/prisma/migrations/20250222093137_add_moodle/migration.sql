/*
  Warnings:

  - You are about to drop the column `expertId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `desc` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unifiedUserId,communityId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Made the column `creatorId` on table `Community` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `unifiedUserId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Community" DROP CONSTRAINT "Community_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_expertId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropIndex
DROP INDEX "Subscription_userId_expertId_communityId_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "photoURL" TEXT NOT NULL DEFAULT 'https://robohash.org/dojo';

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "communityType" TEXT,
ADD COLUMN     "initialCommunity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCatchupLive" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "creatorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "Expert" ADD COLUMN     "isActive" BOOLEAN DEFAULT true,
ADD COLUMN     "isClubHead" BOOLEAN;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "isActive" BOOLEAN DEFAULT true,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "expertId",
DROP COLUMN "userId",
ADD COLUMN     "unifiedUserId" INTEGER NOT NULL,
ALTER COLUMN "transactionId" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "startsAt" DROP NOT NULL,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "desc",
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "awards" TEXT[],
ADD COLUMN     "careerHistory" TEXT[],
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "collaborations" TEXT[],
ADD COLUMN     "culinaryPhilosophy" TEXT,
ADD COLUMN     "currentPosition" TEXT,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "eventsParticipation" TEXT[],
ADD COLUMN     "expertise" TEXT,
ADD COLUMN     "ifcaInvolvement" TEXT[],
ADD COLUMN     "industryContributions" TEXT[],
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "languageProficiency" JSONB,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mentorship" TEXT[],
ADD COLUMN     "mentorshipAvailability" BOOLEAN,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "onlinePortfolios" TEXT[],
ADD COLUMN     "preferredContact" TEXT,
ADD COLUMN     "preferredName" TEXT,
ADD COLUMN     "professionalNetworks" TEXT[],
ADD COLUMN     "publications" TEXT[],
ADD COLUMN     "recipes" TEXT[],
ADD COLUMN     "roleDescription" TEXT,
ADD COLUMN     "socialMediaLinks" TEXT[],
ADD COLUMN     "specializations" TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "sustainability" TEXT,
ADD COLUMN     "technologySkills" TEXT[],
ADD COLUMN     "tutorials" TEXT[],
ADD COLUMN     "vision" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "pincode" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "unifiedUser" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserQuestions" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDetails" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "q_id" INTEGER,
    "answer" TEXT,

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMapping" (
    "id" SERIAL NOT NULL,
    "childCommunityId" INTEGER NOT NULL,
    "parentCommunityId" INTEGER NOT NULL,

    CONSTRAINT "CommunityMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchUp" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'CatchUp',
    "desc" TEXT NOT NULL DEFAULT 'CatchUp for community members',
    "bannerImgs" TEXT[],
    "infoImgs" TEXT[],
    "roomId" TEXT,
    "creatorId" INTEGER,
    "sessionType" TEXT,
    "isCourse" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER,
    "communityId" INTEGER,
    "isVideoChannel" BOOLEAN NOT NULL DEFAULT false,
    "speakerRequests" JSONB[],
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "isLive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatchUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "lastSubmitDate" TIMESTAMP(3) NOT NULL,
    "attachedFiles" TEXT[],
    "creatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmittedProjects" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "submittedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmittedProjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "q1" TEXT,
    "q2" TEXT,
    "q3" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "communityId" INTEGER,
    "userId" INTEGER,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customForm" (
    "id" SERIAL NOT NULL,
    "formName" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "formLink" TEXT NOT NULL,
    "formImg" TEXT,
    "formDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "communityId" INTEGER NOT NULL,
    "moodleCourseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMapping_parentCommunityId_childCommunityId_key" ON "CommunityMapping"("parentCommunityId", "childCommunityId");

-- CreateIndex
CREATE UNIQUE INDEX "CatchUp_roomId_key" ON "CatchUp"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_userId_key" ON "Reward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_communityId_moodleCourseId_key" ON "Course"("communityId", "moodleCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_unifiedUserId_communityId_key" ON "Subscription"("unifiedUserId", "communityId");

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_q_id_fkey" FOREIGN KEY ("q_id") REFERENCES "UserQuestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMapping" ADD CONSTRAINT "CommunityMapping_childCommunityId_fkey" FOREIGN KEY ("childCommunityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMapping" ADD CONSTRAINT "CommunityMapping_parentCommunityId_fkey" FOREIGN KEY ("parentCommunityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "unifiedUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUp" ADD CONSTRAINT "CatchUp_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUp" ADD CONSTRAINT "CatchUp_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "unifiedUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchUp" ADD CONSTRAINT "CatchUp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_unifiedUserId_fkey" FOREIGN KEY ("unifiedUserId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmittedProjects" ADD CONSTRAINT "SubmittedProjects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmittedProjects" ADD CONSTRAINT "SubmittedProjects_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "unifiedUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
