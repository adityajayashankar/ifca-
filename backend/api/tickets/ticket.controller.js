const { PrismaClient } = require('@prisma/client');
const { createCustomError } = require('../../middleware/errorHandling');
const prisma = new PrismaClient();

// create a ticket
exports.createTicket=async function(req,res,next){
    try {
        
        const ticket=await prisma.tickets.create({data:req.body});
        return res.status(201).json({status:201,ticket});
    } catch (err) {
        console.log(`Error while creating ticket`);
        console.log(err);
        next(err);
    }
}

// get a ticket 
exports.getTicket=async function(req,res,next){
    const {id}=req.params;
    try {
        const ticket=await prisma.tickets.findUnique({where:{id:parseInt(id)}});
        return res.status(200).json({status:200,ticket});
    } catch (err) {
        console.log(`Error while fetching ticket id: ${id}`);
        console.log(err);
        next(err);
    }
}

// dev
exports.getAllTickets=async function(req,res,next){
    try {
        const tickets=await prisma.tickets.findMany({include:{raisedBy:true}});
        return res.status(200).json({status:200,tickets});
    } catch (err) {
        console.log(`Error while fetching ticket id: ${id}`);
        console.log(err);
        next(err);   
    }
}

exports.getUserTickets=async function(req,res,next){
    const {userId}=req.params;
    try {
        const user=await prisma.user.findUnique({where:{id:parseInt(userId)}});
        if(!user) throw createCustomError({status:404,message:"Couldnt find user"});

        const userTickets=await prisma.tickets.findMany({where:{userId:parseInt(userId)}});
        return res.status(200).json({status:200,tickets:userTickets});
    } catch (err) {
        console.log(`Error while fetching tickets for userId: ${userId}`);
        console.log(err);
        next(err);   
    }
}

// update ticket
exports.updateTicket=async function(req,res,next){
    const {id}=req.params;
    try {
        const ticket=await prisma.tickets.update({where:{id:parseInt(id)},data:req.body});
        return res.status(201).json({status:201,ticket});
    } catch (err) {
        console.log(`Error while updating ticket id:${id}`);
        console.log(err);
        next(err);
    }
}


