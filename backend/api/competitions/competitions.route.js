const router = require("express").Router();
const competitions = require("./competitions.controller");

router.get('/getCompetitionsByCreatorId/:id', competitions.getcompetitionsByCreatorId)
router.get('/getPastCompetitionsByCreatorId/:id', competitions.getPastCompetitionsByCreatorId)

router.post('/submitResponse', competitions.submitResponse)
router.get('/getResponsesForEvaluator/:id', competitions.getResponsesForEvaluator)
router.get('/:competitionId/stage/user/:userId', competitions.getNextStageForUser)
router.post('/submitEvaluatorResponse', competitions.submitEvaluatorResponse)
router.get('/getUserSubmissions/:userId', competitions.getUserSubmissions)
router.get('/getSubmissionsForCreator/:competitionId', competitions.getSubmissionsForCreator)
router.get('/checkUserSubmission/:competitionId/:userId', competitions.checkUserSubmission)
router.get('/getUserSubmissionStatus/:userId', competitions.getUserSubmissionStatus)
router.delete('/:id', competitions.deleteCompetition)

router
  .route("/")
  .post([competitions.createCompetition])
  .get([competitions.getActiveCompetitions])

router
  .route("/:id")
  .get([competitions.getCompetitionById])

module.exports = router;