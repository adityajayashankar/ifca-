const { mailTemplate } = require("../utils/mailtemplates/mail-template")
// const { sendEmail } = require("../utils/sendMail")
const {sendEmailHelper}=require('../api/mail/email.js')
exports.sendMail = async function (req, res, next) {
    try {
        const { name, h1, h2, main, content, senderUrl, subject } = req.mailObject;
        await sendEmailHelper({name, h1, h2, main, content, senderUrl, subject})
        // sendEmail({content : mailTemplate({name , h1, h2, main, content }), senderUrl : senderUrl, subject})
        next()
    } catch (err) {
        console.log("Error while sending mail !", err)
        next(err)
    }
}
