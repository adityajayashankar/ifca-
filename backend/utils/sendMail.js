const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "mails.getsubspace.tech";

const mg = mailgun.client({ username: "api", key: api_key });

// Strict email validation: single address only, no whitespace, no control chars.
// Rejects non-string types and injection-style payloads (e.g., objects with $gt/$ne keys).
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const validateString = (value, name, maxLen) => {
  if (typeof value !== "string") {
    throw new TypeError(`sendEmail: ${name} must be a string`);
  }
  if (value.length === 0 || value.length > maxLen) {
    throw new RangeError(`sendEmail: ${name} length out of allowed range (1-${maxLen})`);
  }
  return value;
};

const sendEmail = ({ content, senderUrl, subject }) => {
  // Fail fast on untrusted/invalid input before it reaches the Mailgun API.
  const to = validateString(senderUrl, "senderUrl", 254).trim();
  if (!EMAIL_RE.test(to)) {
    throw new RangeError("sendEmail: senderUrl is not a valid email address");
  }
  const safeSubject = validateString(subject, "subject", 255);
  const safeContent = validateString(content, "content", 100000);

  const messageData = {
    from: "Subspace Community<info@getsubspace.tech>",
    to: to,
    subject: safeSubject,
    html: safeContent,
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
