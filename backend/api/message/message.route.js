const router = require('express').Router();

const {createMessage,  getUserMessages, getChannelMessages,  deleteMessage} = require('./message.controller')

router.post('/',createMessage)

router.get('/usermessage', getUserMessages)

router.get('/channelmessage/:channelId', getChannelMessages)

router.delete('/:id', deleteMessage)

module.exports = router