const router = require("express").Router();
const order = require("./order.controller");
const { authenticateToken } = require("../../middleware/authenticateToken");

router.route("/createOrder").post([order.createOrder]);

router.route("/verification").post([order.verifyPayment]);

router.route("/verifyOrderOwership/:userId").post(order.verifyOrderOwnership);

module.exports = router;
