const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getTierByCommunitySession=function(communityId,sessionSlotId){
    return new Promise((resolve,reject)=>{
        prisma.community.findUnique({where:{id:parseInt(communityId)},
        include:{SessionTier:true}
        }).then((commmunity)=>{
            let tier=commmunity.SessionTier.find((tier)=>tier.communityId===parseInt(communityId) && tier.sessionSlotId===parseInt(sessionSlotId))
            resolve(tier)
        }).catch((err)=>{
            reject(err);
        })
    })
}