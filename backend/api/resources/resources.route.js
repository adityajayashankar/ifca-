const resources = require("./resources.controller");
const express = require("express");
const router = express.Router();

// community
router
  .route("/:comId/resources")
  .post(resources.uploadResources)
  .get(resources.getResources);

router.delete("/com/resources/:comId", [resources.deleteResources]);
router.post("/:comId/resources/edit", [resources.editResources]);

// Sessions
router
  .route("/session/:sessionId")
  .post(resources.createResourceForSession)
  .get(resources.getResourcesBySession)
  .delete(resources.deleteResourcesForSession);

router
  .route("/session/edit/:sessionId")
  .post(resources.editResourcesForSession);

router.route("/global").get(resources.getAllResourcesGlobal);

router
  .route("/:resourceId")
  .get(resources.getIdvlResource)
  .post(resources.createResource)
  .patch(resources.editIdvlResource)
  .delete(resources.deleteIdvlResource);


router.route("/all/:userId").get(resources.getAllResources);
module.exports = router;
