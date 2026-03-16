const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const { createCustomError } = require('../../middleware/errorHandling');
const { findUserChannelHelper, createUserChannelHelper } = require('../services/chat.service');
const { v4: uuid } = require("uuid");
const { parse } = require('dotenv');
const {findChannelByIdHelper}=require('../services/getById')

// req.body={name,communityId,isDm:false,photoURL}
exports.createChannel = async (req, res, next) => {
    try {
        const channel = await prisma.channels.create({
            data: req.body
        })
        return res.status(201).json({ channel })
    } catch (error) {
        console.log('Error while creating channel ', __filename)
        console.log(error)
        next(error)
    }
}

// create channel + userchannel
// USED IN A SCENARIO WHERE 
// A NEW USER IS DISCOVERED AND 
// A MESSAGE HAS TO BE SENT IN A NEW CHANNEL AND NEW USER CHANNEL
exports.createUserChannel = async (req, res, next) => {
    try {
        const { recvId } = req.params;
        const channel = await prisma.channels.create({
            data: {
                name: uuid(),
                isDm: true,
                communityId:req.body.communityId
            }
        })
        const userchannel = await prisma.userChannels.create({
            data: {
                userId: parseInt(recvId),
                channelId: parseInt(channel.id)
            }
        })
        return res.status(201).send({ channel: userchannel })
    } catch (error) {
        console.log('Error while creating userChannel ', __filename)
        console.log(error)
        next(error)
    }
}

// DEV ONLY
exports.getChannels = async (req, res, next) => {
    try {
        const channels = await prisma.channels.findMany()
        return res.status(200).send(channels)
    } catch (error) {
        console.log('Error while fetching getting channels ', __filename)
        console.log(error)
        next(error)
    }
}

exports.getChannelsByCommunity=async (req,res,next)=>{
    const {communityId}=req.params;
    try {
        const channels = await prisma.channels.findMany({where:{communityId:parseInt(communityId)}})
        return res.status(200).send({channels})
    } catch (error) {
        console.log('Error while fetching getting channels ', __filename)
        console.log(error)
        next(error)
    }
}

// to get user channels
exports.getUserChannels = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.subscription.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                userChannels:{
                    include:{
                        channel:{
                            include:{
                                userChannels:{
                                    include:{
                                        user:{
                                            include:{
                                                user:true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
               
            }
        })
        if(!user){
            throw createCustomError({status:404,message:"Couldnt find user"})
        }

        const channels=[]
        const dms = []
        user.userChannels.forEach((item) => {
            if (item.channel.isDm) {
                let recvUser = item.channel.userChannels.find((ele) => ele.userId !== parseInt(id))
                let obj = JSON.parse(JSON.stringify(item));
                if (recvUser) {
                    // doesnt have any connections
                    obj.channel.name = recvUser.user.user.name
                    obj.channel.recvId = recvUser.user.id
                    dms.push(obj)
                }
            }else{
                channels.push(item)
            }
        })

        const community_channels=await prisma.channels.findMany({where:{communityId:user.communityId,isDm:false},include:{userChannels:true}})

        

        return res.status(200).send({ channels:community_channels, dms })
    } catch (error) {
        console.log('Error while fetching  user channels ', __filename)
        console.log(error)
        next(error)
    }
}


exports.getChannelById=async (req,res,next)=>{
    const {channelId}=req.params;
    try {
        const channel=await findChannelByIdHelper(channelId)
        return res.status(200).json({channel})
    } catch (err) {
        console.log(`Error while getting channel ${channelId} @ ${__filename}`)
        console.log(err)
        next(err)
    }
}

exports.updateChannelById=async (req,res,next)=>{
    const {channelId}=req.params;
    try {
        await findChannelByIdHelper(channelId)
        const updatedChannel=await prisma.channels.update({where:{id:parseInt(channelId)},data:req.body})
        return res.status(200).json({channel:updatedChannel})
    } catch (err) {
        console.log(`Error while updating channel ${channelId} @ ${__filename}`)
        console.log(err)
        next(err)
    }
}

exports.deleteChannelById=async (req,res,next)=>{
    const {channelId}=req.params;
    try {
        await findChannelByIdHelper(channelId)
        const channel=await prisma.channels.delete({where:{id:parseInt(channelId)}})

        return res.status(200).json({channel})
    } catch (err) {
        console.log(`Error while deleting channel ${channelId} @ ${__filename}`)
        console.log(err)
        next(err)
    }
}