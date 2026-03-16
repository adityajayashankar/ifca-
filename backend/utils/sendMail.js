const sendMail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: 'your-email@example.com',
      to: to,
      subject: subject,
      text: text
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false, // or 'STARTTLS'
  auth: {
    user: 'your-email@example.com',
    pass: process.env.EMAIL_PASSWORD
  }
});