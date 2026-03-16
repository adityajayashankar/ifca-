const router = require('express').Router();

const {createChannel , getChannels,createUserChannel, getUserChannels, getChannelsByCommunity, getChannelById, deleteChannelById, updateChannelById} = require('./channel.controller')

router.route('/').post(createChannel)
.get(getChannels)


router.route('/:channelId')
.get(getChannelById)
.delete(deleteChannelById)
.patch(updateChannelById);

router.route('/community/:communityId').get(getChannelsByCommunity);
// to create userChannel
router.post('/userchannels/:recvId',createUserChannel)

// to get userChannels
router.get('/userchannels/:id', getUserChannels)


module.exports = router