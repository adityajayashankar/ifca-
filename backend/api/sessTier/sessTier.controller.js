const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {createCustomError}=require('../../middleware/errorHandling');
const { getCommunitySubscriptionsHelper, getCommunitySubsStdForm } = require('../community/community');
const { getTierByCommunitySession } = require('./tier');


// CREATE A SESSION TIER WITH SPECIFIC NUMBER OF PEOPLE
exports.createSessionTier=async function(req,res,next){
    let {communityId,sessionSlotId,discount}=req.body;
    try {
        if(!communityId || !sessionSlotId){
            throw createCustomError({status:400,message:"Missing communityID & sessionSlotId"})
        }
        let numParticipants;
            let subs=await getCommunitySubscriptionsHelper(parseInt(communityId))
            let {subscriptions}=getCommunitySubsStdForm(subs)
            numParticipants=subscriptions.length || 20;
        
        const sessionTier=await prisma.sessionTier.create({data:{communityId,sessionSlotId,discount,numParticipants}})
        return res.status(200).json({tier:sessionTier})
    } catch (err) {
        console.log(`Error while creating sessionTier for ${communityId} @ ${__filename}`)
        console.log(err)
        next(err)
    }
}

exports.getSessionTierByCommunityId=async function(req,res,next){
    const {communityId,sessionSlotId}=req.query;
    try {
        if(!communityId || !sessionSlotId){
            throw createCustomError({status:400,message:"Missing communityID & sessionSlotId"})
        }
        const tier=await getTierByCommunitySession(communityId,sessionSlotId);
        if(!tier){
            throw createCustomError({status:404,message:"Couldnt resolve tier"});
        }

        return res.status(200).json({tier})
    } catch (err) {
        console.log(`Error while getting sessionTier for ${communityId} & ${sessionSlotId} @ ${__filename}`);
        console.log(err)
        next(err)
    }
}
// update session tier
exports.updateSessionTierByCommunityId=async function(req,res,next){
    const {communityId,sessionSlotId}=req.query;
    try {
        if(!communityId || !sessionSlotId){
            throw createCustomError({status:400,message:"Missing communityID & sessionSlotId"})
        }
        const tier=await getTierByCommunitySession(communityId,sessionSlotId);
        if(!tier){
            throw createCustomError({status:404,message:"Couldnt resolve tier"});
        }
        const updatedTier=await prisma.sessionTier.update({where:{id:tier.id},data:req.body})
        return res.status(200).json({tier:updatedTier})
    } catch (err) {
        console.log(`Error while updating sessionTier for ${communityId} & ${sessionSlotId} @ ${__filename}`);
        console.log(err)
        next(err)
    }
}

exports.deleteSessionTierByCommunityId=async function(req,res,next){
    const {communityId,sessionSlotId}=req.query;
    try {
        if(!communityId || !sessionSlotId){
            throw createCustomError({status:400,message:"Missing communityID & sessionSlotId"})
        }
        const tier=await getTierByCommunitySession(communityId,sessionSlotId);
        if(!tier){
            throw createCustomError({status:404,message:"Couldnt resolve tier"});
        }
        const deletedTier=await prisma.sessionTier.delete({where:{id:tier.id}})
        return res.status(200).json({tier:deletedTier})
    } catch (err) {
        console.log(`Error while deleting sessionTier for ${communityId} & ${sessionSlotId} @ ${__filename}`);
        console.log(err)
        next(err)
    }
}

// All session tiers
exports.getAllSessionTiers=async function(req,res,next){

    try {
        const {communityId}=req.query;
        let tiers;
        if(communityId){
            const community=await prisma.community.findUnique({where:{id:parseInt(communityId)},include:{
                SessionTier:true
            }})
    
            if(!community){
                throw createCustomError({status:404,message:"Couldnt find commmunity"})
            }
            tiers=community.SessionTier
        }else{
            tiers=await prisma.sessionTier.findMany({})
        }
        return res.status(200).json({tiers})
    } catch (err) {
        console.log(`Error while getting all session tiers @ ${__filename}`);
        console.log(err)
        next(err)
    }
}