const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const { createCustomError } = require('../../middleware/errorHandling');
const { findUserChannelHelper, createUserChannelHelper } = require('../services/chat.service');
const { findChannelByIdHelper } = require('../services/getById');

// creates message for individual chat
exports.createMessage = async function (req, res, next) {
    try {
        const { channelId, senderId, recvId } = req.body

        const findChannel = await findUserChannelHelper(senderId, channelId)
        if (!findChannel) {
            await createUserChannelHelper(senderId, channelId)
        }
        if (recvId) {
            const findChannel = await findUserChannelHelper(recvId, channelId)
            if (!findChannel) {
                await createUserChannelHelper(recvId, channelId)
            }
        }
        const message = await prisma.message.create({
            data: {
                ...req.body,
            },
            include: {
                sender: {
                    include:{
                        user:true,
                        expert:true
                    }
                },
                channel: {
                    include: {
                        userChannels: true
                    }
                }
            }
        })
        return res.status(201).json({ status: 201, message })
    } catch (error) {
        console.log('Error while creating message ', __filename)
        console.log(error)
        next(error)
    }
}


// delete message
exports.deleteMessage = async function (req, res, next) {
    try {
        const { id } = req.params
        const message = await prisma.message.delete({
            where: {
                id: parseInt(id)
            }
        })
        return res.status(200).json({ message })
    } catch (error) {
        console.log('Error while deleting message ', __filename)
        console.log(error)
        next(error)
    }
}



// get messages between two users
exports.getUserMessages = async (req, res, next) => {
    try {
        const { senderId, recvId } = req.body;
        console.log(req.body)
        const userMessages = await prisma.message.findMany({
            where: { senderId: senderId, recvId: recvId },
            include: { sender: true, recv: true }
        })
        return res.status(200).send(userMessages)
    } catch (error) {
        console.log('Error while creating fetching user messages ', __filename)
        console.log(error)
        next(error)
    }
}

// get channel messages
exports.getChannelMessages = async (req, res, next) => {
    try {
        const { channelId } = req.params;
        const channelMessages = await prisma.message.findMany({
            where: { channelId: parseInt(channelId) },
            include: { channel: true, sender:{
                include:{
                    user:true,
                    expert:true
                }
            } }
        })
        return res.status(200).send({messages:channelMessages})
    } catch (error) {
        console.log('Error while fetching channel messages ', __filename)
        console.log(error)
        next(error)
    }
}