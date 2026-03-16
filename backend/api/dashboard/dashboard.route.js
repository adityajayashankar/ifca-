const router = require("express").Router();
const dashboard = require("./dashboard.controller");

// Public route - no authentication required
router.get("/stats/public", dashboard.getPublicStats);

module.exports = router;


