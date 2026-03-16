const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.verifyAdmin = async function(req,res,next){
    try{
        // Logic for checking admin
        const admin = await prisma.admin.findMany({
            where:{
                email:req.body.email
            }
        })

        if(admin)
            next()
    }catch(e){
        console.log(e);
        return res.status(403).json({
            success:false,
            msg:"User needs to be admin"
        })
    }
}