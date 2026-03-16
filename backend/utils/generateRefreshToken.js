const jwt = require('jsonwebtoken');

module.exports = function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: '1d',
    });
};
