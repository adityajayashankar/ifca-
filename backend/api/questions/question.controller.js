const { PrismaClient } = require("@prisma/client");
const { parse } = require("dotenv");
const prisma = new PrismaClient();



exports.createQuestions = async function (req, res, next) {
    const { question } = req.body
    try {
        const questions = await prisma.userQuestions.create({
            data: {
                question: question
            }
        })

        if (question) return res.status(200).json({
            success: true,
            msg: "Question saved"
        })
        else return res.status(403).json({
            success: false,
            msg: "ERROR in Saving Question"
        })
    } catch (e) {
        console.log(e);
    }
}

exports.showAllQuestions = async function (req, res, next) {
    try {
        const questions = await prisma.userQuestions.findMany()
        // console.log(questions);
        return res.status(200).json({
            success: true,
            questions
        })
    } catch (e) {
        console.log(e);
    }
}

exports.activeInactiveQuestions = async function (req, res, next) {

    const { id, isEnable } = req.body

    try {
        const question = await prisma.userQuestions.update({
            where: { id: parseInt(id) },
            data: {
                isEnable: !isEnable
            }
        })

        return res.status(200).json({
            success: true,
            msg: "Question Mode Changed"
        })
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            msg: "Error while changing mode"
        })
    }
}

exports.removeQuestion = async function (req, res, next) {
    const { id } = req.params

    try {
        const question = await prisma.userQuestions.delete({
            where: { id: parseInt(id) }
        })

        if (question) return res.status(200).json({
            success: true,
            msg: "Question Removed"
        })
    } catch (e) {
        console.log(e);
    }
}

exports.getSelectedQuestions = async function (req, res, next) {
    try {
        const questions = await prisma.userQuestions.findMany({
            where: { isEnable: true }
        })

        if (questions) return res.status(200).json({
            success: true,
            questions: questions
        })
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            msg: "Error in fetching questions"
        })
    }
}

exports.editQuestion = async function (req, res, next) {
    const { id, question } = req.body

    try {
        const userQues = await prisma.userQuestions.update({
            where: { id: parseInt(id) },
            data: {
                question: question
            }
        })

        return res.status(200).json({
            success: true,
            userQues: userQues,
            msg: "Edit Success"
        })
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            msg: "Not Able to edit the Question"
        })
    }
}

exports.acceptAnswers = async function (req, res, next) {

    const { details } = req.body
    console.log(req.body);
    console.log(details);
    try {
        const user = await prisma.user.findUnique({
            where:{email:req.params.email}
        })
        console.log(user);
        details.forEach(async item => {
            const { q_id, answer } = item
            const userDetails = await prisma.userDetails.create({
                data:{
                    question:{
                        connect:{
                            id:parseInt(q_id)
                        }
                    },
                    answer:answer,
                    user:{
                        connect:{
                            id:user.id
                        }
                    }
                }
            })
        })

        return res.status(200).json({
            success:true,
            msg:"RESPONSE SAVED"
        })
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            success: false,
            msg: "ERROR in accepting answers"
        })
    }
}

exports.displayAnswersByUser = async function(req,res,next){
    const {id} = req.params
    // console.log(id);
    try{
        const details = await prisma.userDetails.findMany({
            where:{userId:parseInt(id)},
            include:{question:true}
        })        

        // console.log(details);

        return res.status(200).json({
            success:true,
            msg:"DETAILS FETCHED",
            details:details
        })
        
    }catch(e){
        console.log(e);
        return res.status(400).json({
            success:false,
            msg:"ERROR IN FETCHING ANSWERS"
        })
    }
}