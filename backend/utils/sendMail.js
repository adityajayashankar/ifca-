const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "mails.getsubspace.tech";

const mg = mailgun.client({ username: "api", key: api_key });

const EMAIL_RE = /^[^\s@<>,;:"'`$&|]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const SUBJECT_MAX_LEN = 255;

const sanitizeSubject = (subject) => {
  if (typeof subject !== "string") return "";
  // Strip control characters, cap length.
  return subject.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").slice(0, SUBJECT_MAX_LEN);
};

const sanitizeHtml = (html) => {
  if (typeof html !== "string") return "";
  return html
    // Remove script/style blocks entirely.
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // Strip event handler attributes (on*).
    .replace(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Neutralize javascript:/vbscript: URLs.
    .replace(/(href|src)\s*=\s*("|')?\s*(javascript|vbscript|data):[^"'>\s]*/gi, '$1="#"')
    // Remove string-template delimiters that could be interpreted downstream.
    .replace(/\$\{|<%|%>|\{\{/g, "");
};

const sendEmail = ({ content, senderUrl, subject }) => {
  if (!senderUrl || typeof senderUrl !== "string" || !EMAIL_RE.test(senderUrl.trim())) {
    return Promise.reject(new Error("sendEmail: invalid or missing recipient email address"));
  }

  const messageData = {
    from: "Subspace Community<info@getsubspace.tech>",
    to: senderUrl.trim(),
    subject: sanitizeSubject(subject),
    html: sanitizeHtml(content),
  };

  return mg.messages.create(domain, messageData);
};

module.exports = { sendEmail };

// import html, sendMail
// sendEmail({content:forgotPassword({name:user.name}),senderUrl:email,subject:'Forgot password'})
