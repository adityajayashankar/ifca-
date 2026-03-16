-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "unifiedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
