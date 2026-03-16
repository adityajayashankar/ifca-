const express = require("express");
const router = express.Router();
const serviceController = require("./service.controller");
const { authenticateToken } = require("../../middleware/authenticateToken");

router.post('/', serviceController.createService)
router.get('/getServiceById/:id', serviceController.getServiceById)
router.post('/subscribeToService',serviceController.subscribeToService )
router.get('/getResponseForCreator/:creatorId', serviceController.getResponseForCreator)
router.get('/getAllResponsesByCommunityId/:communityId', serviceController.getAllResponsesByCommunityId)
router.get('/getServicesByCommunityId/:communityId', authenticateToken, serviceController.getServicesByCommunityId)
router.get('/getServiceResponsesWithRole/:serviceId', authenticateToken, serviceController.getServiceResponsesWithRole)
router.get('/hasUserInterested/:serviceId/:userId', serviceController.hasUserInterested)
router.get('/getUserInterests/:userId', serviceController.getUserInterests)

module.exports = router;

