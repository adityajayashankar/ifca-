const { PrismaClient } = require('@prisma/client');
// const createError=require('http-errors');

const prisma = new PrismaClient();


// get the number of people, who'd be attending the session.
exports.getNumberAttendance=function(sessionSlotId){
        const number=prisma.attendance.count({
            where:{sessionSlotId:sessionSlotId}
        })
        return number;
}

exports.deleteRecordBundles=function(ids){
    if(!ids) return Promise.reject("Couldnt get ids");
    const promises=[];
    ids.forEach(id=>{
        promises.push(prisma.attendance.delete({
            where:{id:parseInt(id)}
        }))
    })

    return Promise.all(promises);
}