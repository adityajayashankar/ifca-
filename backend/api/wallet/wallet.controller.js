const { PrismaClient } = require('@prisma/client');
const { createCustomError } = require('../../middleware/errorHandling');
const prisma = new PrismaClient();

// create a wallet
exports.createWallet=async function(req,res,next){
    try {
        if(req.body.amount<500){
            throw createCustomError({status:400,message:"Minimum account balance: 500"})
        }
        const wallet=await prisma.wallet.create({data:req.body});
        return res.status(201).json({status:201,wallet});
    } catch (err) {
        console.log(`Error while creating wallet`);
        console.log(err);
        next(err);
    }
}

// get a wallet 
exports.getWallet=async function(req,res,next){
    const {userId}=req.params;
    try {
        const user=await prisma.user.findUnique({where:{id:parseInt(userId)}});
        if(!user){
            throw createCustomError({status:404,message:"User not found"});

        }
        
        const wallet=await prisma.wallet.findUnique({where:{userId:parseInt(userId)}});
        return res.status(200).json({status:200,wallet});
    } catch (err) {
        console.log(`Error while fetching wallet userId:${userId}`);
        console.log(err);
        next(err);
    }
}

// update wallet
exports.updateWallet=async function(req,res,next){
    const {userId}=req.params;
    try {
        const user=await prisma.user.findUnique({where:{id:parseInt(userId)}});
        if(!user) {
            throw createCustomError({status:404,message:"User not found"});
        }

        if(req.body.amount<500){
            throw createCustomError({status:400,message:"Minimum account balance: 500"})
        }

        const wallet=await prisma.wallet.update({where:{userId:parseInt(userId)},data:req.body});
        return res.status(200).json({status:200,wallet});
    } catch (err) {
        console.log(`Error while updating wallet userId:${userId}`);
        console.log(err);
        next(err);
    }
}
