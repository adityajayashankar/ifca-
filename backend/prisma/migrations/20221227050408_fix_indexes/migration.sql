/*
  Warnings:

  - A unique constraint covering the columns `[blogId,communityId]` on the table `CommunityBlog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unifiedUserId,eventId]` on the table `EventAttendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tagId,postId]` on the table `PostTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CommunityBlog_blogId_communityId_key" ON "CommunityBlog"("blogId", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_unifiedUserId_eventId_key" ON "EventAttendance"("unifiedUserId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "PostTag_tagId_postId_key" ON "PostTag"("tagId", "postId");
