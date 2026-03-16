-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "blogId" TEXT;

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "unifiedUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityBlog" (
    "id" SERIAL NOT NULL,
    "blogId" TEXT NOT NULL,
    "communityId" INTEGER NOT NULL,

    CONSTRAINT "CommunityBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogTags" (
    "id" SERIAL NOT NULL,
    "tagId" INTEGER NOT NULL,
    "blogId" TEXT NOT NULL,

    CONSTRAINT "BlogTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogLikes" (
    "id" TEXT NOT NULL,
    "like" INTEGER NOT NULL DEFAULT 1,
    "userId" INTEGER NOT NULL,
    "blogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogLikes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogTags_blogId_tagId_key" ON "BlogTags"("blogId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogLikes_userId_blogId_key" ON "BlogLikes"("userId", "blogId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_unifiedUserId_fkey" FOREIGN KEY ("unifiedUserId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBlog" ADD CONSTRAINT "CommunityBlog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBlog" ADD CONSTRAINT "CommunityBlog_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogTags" ADD CONSTRAINT "BlogTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogTags" ADD CONSTRAINT "BlogTags_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogLikes" ADD CONSTRAINT "BlogLikes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogLikes" ADD CONSTRAINT "BlogLikes_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
