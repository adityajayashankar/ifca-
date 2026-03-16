const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "mails.getsubspace.tech";

const mg = mailgun.client({ username: "api", key: api_key });

const sendEmail = ({ content, senderUrl, subject }) => {
  const messageData = {
    from: "Subspace Community<info@getsubspace.tech>",
    to: senderUrl,
    subject: subject,
    html: content,
  };

  mg.messages
    .create(domain, messageData)
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = { sendEmail };

// import html, sendMail
// sendEmail({content:forgotPassword({name:user.name}),senderUrl:email,subject:'Forgot password'})
