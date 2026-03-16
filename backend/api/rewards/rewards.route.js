const express = require("express");
const router = express.Router();

const rewards = require('./rewards.controller')

router.get("/user/:userId", rewards.getUserRewards)
router.get("/getAllRules", rewards.getAllRewardRules)
router.put("/updateRules", rewards.updateRewardRules)
router.post("/updateUserReward", rewards.updateUserReward)
router.get("/getUserRewardHistory/:userId", rewards.getUserRewardHistory)

module.exports = router;

