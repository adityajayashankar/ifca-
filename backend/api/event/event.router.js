const router = require("express").Router();
const event = require("./event.controller");
const { authenticateToken } = require("../../middleware/authenticateToken");
const {
  authenticateUnifiedUser,
} = require("../../middleware/authenticateUnified");

router
  .route("/")
  .get(event.viewAllEvents)
  .post([authenticateToken, authenticateUnifiedUser, event.createEvent]);

router
  .route("/archived")
  .get([authenticateToken, event.viewAllEventsIncludingArchived]);

router
  .route("/:eventId")
  .get(event.viewEventById)
  .patch([authenticateToken, authenticateUnifiedUser, event.updateEventById])
  .delete([authenticateToken, authenticateUnifiedUser, event.deleteEventById]);

router
  .route("/:eventId/user")
  .post([authenticateToken, authenticateUnifiedUser, event.buyEventPass]);

module.exports = router;
