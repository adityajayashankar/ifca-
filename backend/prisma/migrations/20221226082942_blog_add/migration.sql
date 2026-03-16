-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "communityId" INTEGER,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
