const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.addPeopleToSubcommunityHelper=async function({users,communityId,subCommunityId}){
    let promises=[]
    for(let user of users){
        let subscription;
        if(user.userType==="expert"){
            let temp=await prisma.subscription.findMany({where:{AND:[
                {expert:{email:user.email}},
                {communityId:communityId}
            ]}});
            let today=new Date()
            subscription=temp.find((item)=>new Date(item.expiresAt)>today)
        }else{
            let temp=await prisma.subscription.findMany({where:{AND:[
                {user:{email:user.email}},
                {communityId:communityId}
            ]}});
            let today=new Date()
            subscription=temp.find((item)=>new Date(item.expiresAt)>today)
        }
        if(subscription){
            promises.push(prisma.userSubCommunity.create({data:{subscriptionId:subscription.id,role:user.role,subCommunityId}}))
        }
    }

    return prisma.$transaction([...promises])
}