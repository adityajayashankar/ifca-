const {mailTemplate}=require('../../utils/mailtemplates/mail-template')

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

var api_key = process.env.MAILGUN_API_KEY || "";
var domain = process.env.MAILGUN_DOMAIN || "mails.getsubspace.tech";

const mg = mailgun.client({username: 'api', key: api_key });


exports.sendEmailHelper = ({name , h1, h2, main, content,senderUrl,subject}) => {
    const messageData = {
        from: "Subspace Community<info@getsubspace.tech>",
        to: senderUrl,
        subject: subject,
        html: mailTemplate({name , h1, h2, main, content }),
    }
    
    return mg.messages.create(domain, messageData)
}   
