require('dotenv').config()
const nodemailer = require('nodemailer')

// transporter for noreply
const noReplyTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp-mail.gmail.com',
  secureConnection: false,
  port: 587,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3'
  }
})

module.exports = noReplyTransporter