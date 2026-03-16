const router = require("express").Router();
const sessionThread = require("./sessionThreads.controller");

const {
    authenticateTokenPartner,
    authenticateToken,
    authenticateTokenWithoutReject,
  } = require("../../middleware/authenticateToken");

router.route("/").post([sessionThread.createSessionThread]);
router.route("/:sessionSlotId").get([sessionThread.getSessionThread]);

module.exports = router;