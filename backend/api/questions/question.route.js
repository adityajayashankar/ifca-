const { verifyAdmin } = require('./question')
const { createQuestions, showAllQuestions, getSelectedQuestions, selectQuestions, deselectQuestions, removeQuestion, editQuestion, activeInactiveQuestions, displayAnswersByUser, acceptAnswers } = require('./question.controller')

const router = require('express').Router()

router.route('/create').post(verifyAdmin,createQuestions)
router.route('/show/all').get(verifyAdmin,showAllQuestions)
router.route('/show/select').get(getSelectedQuestions)
router.route('/update/toggle').patch(verifyAdmin,activeInactiveQuestions)
router.route('/update/:id').patch(verifyAdmin,editQuestion)
router.route('/remove/:id').delete(verifyAdmin,removeQuestion)
router.route('/answer/:id').get(verifyAdmin,displayAnswersByUser)
router.route('/details/create/:email').post(acceptAnswers)
module.exports = router