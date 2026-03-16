const express = require('express');
const { generateuploadUrl } = require('./image.controller');

const router = express.Router();

router.post('/generate-presigned-url', generateuploadUrl);

module.exports = router;
