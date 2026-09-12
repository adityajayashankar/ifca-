const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 100000;

const validateEmail = (value) => {
  if (typeof value !== "string" || !EMAIL_REGEX.test(value) || value.length > 254) {
    throw new Error("sendEmail: invalid recipient email address");
  }
  return value;
};

const validateText = (value, name, maxLength) => {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new Error(`sendEmail: invalid ${name}`);
  }
  // Strip control characters (except tab/newline/carriage return) to prevent injection.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
};

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "";

if (!api_key || !domain) {
  throw new Error("Mailgun configuration error: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set");
}

const mg = mailgun.client({ username: "api", key: api_key });

const sendEmail = ({ content, senderUrl, subject }) => {
  return new Promise((resolve, reject) => {
    try {
      const messageData = {
        from: "Subspace Community<info@getsubspace.tech>",
        to: validateEmail(senderUrl),
        subject: validateText(subject, "subject", MAX_SUBJECT_LENGTH),
        html: validateText(content, "content", MAX_CONTENT_LENGTH),
      };

      mg.messages
        .create(domain, messageData)
        .then((res) => {
          console.log("sendEmail: message sent");
          resolve(res);
        })
        .catch((err) => {
          console.error("sendEmail: message send failed:", err && err.message ? err.message : "unknown error");
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { sendEmail };

// import html, sendMail
// sendEmail({content:forgotPassword({name:user.name}),senderUrl:email,subject:'Forgot password'})
