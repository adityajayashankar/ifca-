const router = require("express").Router();
const sess = require("./session.controller");
const cron = require("node-cron");
const {
  authenticateTokenAdmin,
  authenticateToken,
  authenticateTokenExpert,
} = require("../../middleware/authenticateToken");
const { sendReminderEmails } = require("../../utils/remainderMailsSender");

router
  .route("/")
  .get(sess.getAllSessions)
  .post([sess.insertSession]);
router.route("/top-rated").get(sess.getTopRatedSessions);
router.route("/recent-upload").get(sess.getRecentlyUploadedSessions);
router.get("/search", sess.getSessionByTag);
router.get('/slots', sess.getSessionSlotsByDateRange);


router.route("/token").get(sess.getSessionToken);
router.route("/create-room").post(sess.create100msRoom);
router.route("/meeting-status/:roomId").get(sess.checkMeetingStatus);

router
  .route("/:id")
  .get(sess.getSessionById)
  .patch([sess.updateSessionById])
  .delete([sess.deleteSessionById]);

router
  .route("/:sessionId/tags")
  .patch([authenticateToken, sess.updateSessionTags]);
router
  .route("/tags/top")
  .get(sess.getTopSessionTagsTemp)
  .post(sess.setSessionTopTags);
//   .get()

router
  .route("/slot/:sessionSlotId")
  .get(sess.getSessionSlotById)
  .patch([authenticateTokenAdmin, sess.updateSessionSlotById])
  .delete([authenticateTokenAdmin, sess.deleteSessionSlotById]);

router
  .route("/apply/:sessionId")
  .patch([sess.applyAsSpeaker])
  .get([sess.getSpeakerApplications]);

cron.schedule("0 7 * * *", () => {
  sendReminderEmails();
});

module.exports = router;
