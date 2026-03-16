const router = require("express").Router();
const couponCtrl = require("./coupon.controller");
const {
  authenticateTokenPartner,
} = require("../../middleware/authenticateToken");
router
  .route("/")
  .get(couponCtrl.viewAllCoupon)
  .post([authenticateTokenPartner, couponCtrl.createCoupon]);

router
  .route("/:code")
  .get(couponCtrl.viewCouponCode)
  .patch([authenticateTokenPartner, couponCtrl.editCouponCode])
  .delete([authenticateTokenPartner, couponCtrl.deleteCoupon]);

router.route(`/session/:sessionId`).get(couponCtrl.viewAllSessionCoupons);
module.exports = router;
