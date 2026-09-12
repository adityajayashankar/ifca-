const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "mails.getsubspace.tech";

const mg = mailgun.client({ username: "api", key: api_key });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_SUBJECT_LENGTH = 255;
const MAX_CONTENT_LENGTH = 100000;

class EmailValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailValidationError";
  }
}

const validateString = (value, field, maxLength) => {
  if (typeof value !== "string") {
    throw new EmailValidationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new EmailValidationError(`${field} must not be empty`);
  }
  if (trimmed.length > maxLength) {
    throw new EmailValidationError(`${field} exceeds maximum length of ${maxLength}`);
  }
  return trimmed;
};

const sendEmail = ({ content, senderUrl, subject }) => {
  // Validate and sanitize all caller-supplied inputs (CWE-943).
  // Reject non-string values (e.g., NoSQL operator objects like {'$gt': ''}).
  const to = validateString(senderUrl, "senderUrl", 254);
  if (!EMAIL_RE.test(to)) {
    throw new EmailValidationError("senderUrl must be a valid email address");
  }
  const safeSubject = validateString(subject, "subject", MAX_SUBJECT_LENGTH);
  const safeContent = validateString(content, "content", MAX_CONTENT_LENGTH);

  const messageData = {
    from: "Subspace Community<info@getsubspace.tech>",
    to: to,
    subject: safeSubject,
    html: safeContent,
  };

  return mg.messages
    .create(domain, messageData)
    .then((res) => {
      // Log only status, never full response payloads (may contain sensitive content).
      console.log(`sendEmail: message sent, status=${res && res.status}`);
      return res;
    })
    .catch((err) => {
      // Log only error status/message, not full payload bodies.
      console.error(`sendEmail: failed, status=${err && err.status}, message=${err && err.message}`);
      throw err;
    });
};

module.exports = { sendEmail };

// import html, sendMail
// sendEmail({content:forgotPassword({name:user.name}),senderUrl:email,subject:'Forgot password'})
