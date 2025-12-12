const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail({ to, subject, html, attachments = [] }) {
  await transporter.sendMail({
    from: `"SKE" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}

module.exports = { sendMail };
