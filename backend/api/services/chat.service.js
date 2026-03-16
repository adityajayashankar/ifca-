const { PrismaClient } =require('@prisma/client');
const { createCustomError } = require('../../middleware/errorHandling');
const prisma = new PrismaClient()

exports.createUserChannelHelper = (userId, channelId) => {
    const userChannel = prisma.userChannels.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            channel: {
                connect: {
                    id: channelId
                }
            }
        }
    })
    return userChannel
}

exports.findUserChannelHelper = (userId, channelId) => {
    return new Promise((resolve, reject) => {
        if(!channelId || !userId) {
            reject(createCustomError({status: 400, message: "Invalid data !"}))
        }
        prisma.subscription.findUnique({
            where: {
                id: parseInt(userId)
            },
            include: {
                userChannels:true
            }
        }).then((res) => {
            if(!res){
                reject(createCustomError({status:404,message:"Couldnt find user"}))
            }else{
                resolve(res.userChannels.find((channel)=> channel.channelId === channelId))
            }
        }).catch((err) => {
            console.log(err)
            reject(createCustomError({status: 500, message: "Error while finding user channel"}))
        })
    })
}

