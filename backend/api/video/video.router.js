const router=require('express').Router();
const video=require('./video.controller');
router.route('/').post(video.createVideo).get(video.getVideos);
router.route('/:id').patch(video.updateVideo).get(video.getOneVideo).delete(video.deleteVideo);
router.route('/user/:userId').get(video.getUserVideos);
router.route('/community/:communityId').get(video.getCommunityVideos);

module.exports=router;