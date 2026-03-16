// 1. Create subcommunity
// 6. Update subcommunity by Id
// 5. Delete subcommunity
// 3. View subcommunity by Id 
// 8. Search subcommunity
// 2. View subcommunities in a community
// 4. View people in a subcommunity

// 7. View experts in a subcommunity
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createCustomError } = require('../../middleware/errorHandling');
const { findSubCommunityByIdHelper } = require('../services/getById');
const {addPeopleToSubcommunityHelper}=require('./subcommunity')
// req.body={name,desc,photoURL,communityId}
exports.createSubcommunity=async function(req,res,next){
    const {name,desc,photoURL,communityId}=req.body;
    try {
        const subc=prisma.subCommunity.create({data:{name,desc,photoURL,community:{connect:{id:communityId}}}});
        const channel_pre=prisma.channels.create({data:{name,photoURL,isDm:false,communityId}})
        const [subcommunity,channel]=await prisma.$transaction([subc,channel_pre])
        return res.status(200).json({subcommunity,channel})
    } catch (err) {
        console.log(`Error while creating subcommunity @ ${__filename}`);
        console.log(err);
        next(err)
    }
}

exports.getSubCommunityById=async function(req,res,next){
    const { id } = req.params;
    try {
      const community = await findSubCommunityByIdHelper(id);
  
      let communityMappings = await prisma.CommunityMapping.findMany({
        where: {
          OR: [
            { ParentCommunityId: parseInt(id) },
            { ChildCommunityId: parseInt(id) }
          ]
        }
      });

      console.log(communityMappings)
      
      let parentCommunities = [];
      let childCommunities = [];
      
      for (let mapping of communityMappings) {
        if (mapping.ParentCommunityId === id) {
          let childCommunity = await prisma.community.findUnique({
            where: { id: mapping.ChildCommunityId }
          });
      
          if (childCommunity) {
            childCommunities.push({
              id: childCommunity.id,
              title: childCommunity.title
            });
          }
        } else if (mapping.ChildCommunityId === id) {
          let parentCommunity = await prisma.community.findUnique({
            where: { id: mapping.ParentCommunityId }
          });
      
          if (parentCommunity) {
            parentCommunities.push({
              id: parentCommunity.id,
              title: parentCommunity.title
            });
          }
        }
      }
  
      community.childCommunities = childCommunities
      community.parentCommunities = parentCommunities
  
      return res.status(200).json({ community });
    } catch (error) {
      console.log(`Error while fetching community id: ${id} @ ${__filename}`);
      console.log(error);
      next(error);
    }
}

// req.body={desc,name,photoURL}
exports.updateSubCommunityById=async function(req,res,next){
    const {subcommunityId}=req.params;
    try {
        await findSubCommunityByIdHelper(subcommunityId);
        const subcommunity=await prisma.subCommunity.update({where:{id:parseInt(subcommunityId)},data:req.body})
        return res.status(200).json({subcommunity})
    } catch (err) {
        console.log(`Error while updating subcommunity by Id ${subcommunityId} @ ${__filename}`);
        console.log(err);
        next(err)
    }
}

exports.deleteSubCommunityById=async function(req,res,next){
    const {subcommunityId}=req.params;
    try {
        await findSubCommunityByIdHelper(subcommunityId);
        const subcommunity=await prisma.subCommunity.delete({where:{id:parseInt(subcommunityId)}});
        // also delete the channel
        const channel=await prisma.channels.delete({where:{name:subcommunity.name}})
        return res.status(200).json({subcommunity,channel})
    } catch (err) {
        console.log(`Error while deleting subcommunity by Id ${subcommunityId} @ ${__filename}`);
        console.log(err);
        next(err)
    }
}


exports.getSubcommunitiesByTag=async function(req,res,next){
    const {tag}=req.query; 
    try {
        const subcommunities=await prisma.subCommunity.findMany({
            where:{
                OR:[
                    {
                    name:{
                        contains:tag,
                        mode: 'insensitive',
                    }},
                    {
                        desc:{
                            contains:tag,
                            mode:'insensitive'
                        }
                    }
                ]
            },
            include:{
                community:true
            }
        })
        return res.status(200).json({subcommunities});

    } catch (err) {
        console.log(`Error searching for communities with tag: ${tag} @ ${__filename}`);
        console.log(err);
        next(err);
    }
}

exports.getSubcommunitiesByCommunityId=async function(req,res,next){
    const {communityId}=req.params;
    try {
        const subcommunities=await prisma.subCommunity.findMany({where:{communityId:parseInt(communityId)}});
        return res.status(200).json({subcommunities})
    } catch (err) {
        console.log(`Error while fetching subcommunity by community Id ${communityId} @ ${__filename}`);
        console.log(err);
        next(err)
    }
}



exports.getPeople=async function(req,res,next){
    const {subcommunityId}=req.params;
    try {
        const subcommunity=await prisma.subCommunity.findUnique({where:{id:parseInt(subcommunityId)},
            include:{userSubCommunity:{include:{subscription:{include:{user:true,expert:true}}}}}})
        return res.status(200).json({people:subcommunity.userSubCommunity})
    } catch (err) {
        console.log(`Error while retreiving people in subcommunity ${__filename}`);
        console.log(err)
        next(err)
    }
}

// req.body={userId,role,userType}
exports.addPeopletoSubcommunity=async function(req,res,next){
    const {subcommunityId}=req.params;
    try {
        let subcommunity=await findSubCommunityByIdHelper(subcommunityId);
        let subscription;
        if(req.body.userType==="expert"){
            let temp=await prisma.subscription.findMany({where:{AND:[
                {expertId:req.body.userId},
                {communityId:subcommunity.communityId}
            ]}});
            let today=new Date()
            subscription=temp.find((item)=>new Date(item.expiresAt)>today)
        }else{
            let temp=await prisma.subscription.findMany({where:{AND:[
                {userId:req.body.userId},
                {communityId:subcommunity.communityId}
            ]}});
            let today=new Date()
            subscription=temp.find((item)=>new Date(item.expiresAt)>today)
        }
        if(!subscription){
            throw createCustomError({status:404,message:"No subscription found"});
        }
        const userSubCommunity=await prisma.userSubCommunity.create({data:{subscriptionId:subscription.id,role:req.body.role,subCommunityId:subcommunity.id}})
        return res.status(200).json({userSubCommunity})
    } catch (err) {
        console.log(`Error while adding people to subcommunity`);
        console.log(err)
        next(err)
    }
}

// req.body={users:[{email,role,userType}]}
exports.addPeopletoSubcommunityBulk=async function(req,res,next){
    const {subcommunityId}=req.params;
    const {users}=req.body;
    try {
        let subcommunity=await findSubCommunityByIdHelper(subcommunityId);
        const responses=await addPeopleToSubcommunityHelper({users,communityId:subcommunity.communityId,subCommunityId:subcommunity.id})    
        return res.status(200).json({userSubCommunity:responses})
    } catch (err) {
        console.log(`Error while adding people to subcommunity`);
        console.log(err)
        next(err)
    }
}