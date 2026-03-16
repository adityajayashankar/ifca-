const noReplyTransporter = require('./config/email.config')
const userOnboardingOtpEmailTemplate = require('./renders/renderFiles')

const userOnboardingOtpEmail = async (reciever, subject, body) => {
  try {
    const info = await noReplyTransporter.sendMail({
      from: 'contact.pvlifcaindia@gmail.com',
      to: reciever,
      subject,
      html: userOnboardingOtpEmailTemplate({
        user: reciever,
        message: body
      })
    })
    console.log('Message sent: %s', info.messageId)
    return { status: 'ok' }
  } catch (error) {
    console.log(error)
    return { status: 'err' }
  }
}

module.exports = userOnboardingOtpEmail