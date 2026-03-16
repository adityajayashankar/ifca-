-- CreateTable
CREATE TABLE "CouponCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unifiedUserId" INTEGER,
    "discountRate" INTEGER NOT NULL DEFAULT 0,
    "sessionId" INTEGER,
    "communityId" INTEGER,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_code_key" ON "CouponCode"("code");

-- AddForeignKey
ALTER TABLE "CouponCode" ADD CONSTRAINT "CouponCode_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCode" ADD CONSTRAINT "CouponCode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCode" ADD CONSTRAINT "CouponCode_unifiedUserId_fkey" FOREIGN KEY ("unifiedUserId") REFERENCES "unifiedUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
