const { PrismaClient } = require("@prisma/client");
const { findCouponCodeById } = require("../services/getById");
const prisma = new PrismaClient();

// create coupon
exports.createCoupon = async function (req, res, next) {
  try {
    const { code, discountRate, sessionId, communityId } = req.body;
    let couponObj = {
      code,
      unifiedUserId: req.user.unifiedUserId.id,
      discountRate: parseInt(discountRate),
      sessionId,
      communityId,
    };
    const coupon = await prisma.couponCode.create({
      data: couponObj,
    });
    return res.status(201).json({ coupon });
  } catch (error) {
    console.log(`Error occured while creating coupon @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// view all coupon
exports.viewAllCoupon = async function (req, res, next) {
  try {
    const { expired } = req.query;
    if (expired) {
      const expiredCoupons = await prisma.couponCode.findMany({
        where: {
          isExpired: true,
        },
      });
      return res.status(200).json({ coupons: expiredCoupons });
    }
    const allCoupons = await prisma.couponCode.findMany({});
    return res.status(200).json({ coupons: allCoupons });
  } catch (error) {
    console.log(`Error occured while viewing all coupons @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

exports.viewCouponCode = async function (req, res, next) {
  try {
    await findCouponCodeById(req.params.code);
    const coupon = await prisma.couponCode.findUnique({
      where: {
        code: req.params.code,
      },
      include: {
        session: true,
        community: true,
      },
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    console.log(
      `Error occured while viewing coupon ${req.params.code} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// edit coupon
// req.body={isExpired,discountRate}
exports.editCouponCode = async function (req, res, next) {
  try {
    await findCouponCodeById(req.params.code);
    const coupon = await prisma.couponCode.update({
      where: {
        code: req.params.code,
      },
      data: req.body,
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    console.log(
      `Error occured while editing coupon ${req.params.code} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

exports.deleteCoupon = async function (req, res, next) {
  try {
    await findCouponCodeById(req.params.code);
    const coupon = await prisma.couponCode.delete({
      where: {
        code: req.params.code,
      },
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    console.log(
      `Error occurred while deleting coupon ${req.params.code} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// view coupons by session
exports.viewAllSessionCoupons = async function (req, res, next) {
  try {
    let { sessionId } = req.params;
    sessionId = parseInt(sessionId);
    const sessionCoupons = await prisma.couponCode.findMany({
      where: {
        AND: [{ isExpired: false }, { sessionId }],
      },
    });
    return res.status(200).json({ coupons: sessionCoupons });
  } catch (error) {
    console.log(
      `Error occured while viewing all session coupons @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};
