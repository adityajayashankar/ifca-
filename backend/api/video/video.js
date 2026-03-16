const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

    
exports.getVideosByTagHelper=function(tag){
    let videos=prisma.video.findMany({
        where:{
            OR:[
                {
                title:{
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
        }
    })

    return videos;
}

// receives an array of communities
// each community would have an array of videos
// resolve duplicates on the user front
exports.resolveCommunityVideos=function(ids){
    let promises=[];
    ids.forEach((communityId)=>{
        // each community linked with a list of sessions
        promises.push(new Promise((resolve,reject)=>{
            prisma.community.findUnique({where:{id:communityId},include:{videos:true}})
            .then((community)=>{
                let videos=community.videos;
                resolve(videos.map((item)=>({...item,community:[community.title]})))
            }).catch((err)=>{
                reject(err);
            })
        }))
    })

    return promises;
}