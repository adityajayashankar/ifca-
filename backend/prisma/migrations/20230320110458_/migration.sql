-- CreateTable
CREATE TABLE "SessionTags" (
    "id" SERIAL NOT NULL,
    "tagId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "SessionTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopSessionTags" (
    "id" SERIAL NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "TopSessionTags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionTags_sessionId_tagId_key" ON "SessionTags"("sessionId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TopSessionTags_tagId_key" ON "TopSessionTags"("tagId");

-- AddForeignKey
ALTER TABLE "SessionTags" ADD CONSTRAINT "SessionTags_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTags" ADD CONSTRAINT "SessionTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopSessionTags" ADD CONSTRAINT "TopSessionTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
