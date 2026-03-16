const axios = require('axios')
var jwt = require('jsonwebtoken');
var uuid4 = require('uuid4');


const generateRoomId = async (roomName) => {
    console.log(roomName)
    try {
    const app_access_key = process.env.MS_APP_ACCESS_KEY;
    const app_secret_key = process.env.MS_APP_SECRET_KEY;

    console.log("inside")
    var payload = {
        access_key: app_access_key,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000) - 60, // Subtract 60 seconds to ensure token is valid immediately
        nbf: Math.floor(Date.now() / 1000) - 60 // Subtract 60 seconds to ensure token is valid immediately
    };

    let token = jwt.sign(
        payload,
        app_secret_key,
        {
            algorithm: 'HS256',
            expiresIn: '24h',
            jwtid: uuid4()
        }
    );

    console.log("token is", token)
    const config = {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    };
    const response = await axios.post("https://api.100ms.live/v2/rooms", {
        name: roomName || "Sample Room",
        description: "This is a sample description for the room",
        // template_id: "64003f34862ddd899e776cf7"
    }, config)

    console.log("response is", response)
    const roomId = response?.data?.id;
    console.log("roomId is", roomId)
    return roomId;
    } catch (error) {
        console.log("error is", error)
        throw error
    }
}

module.exports = { generateRoomId }