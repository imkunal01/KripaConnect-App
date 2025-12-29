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
    from: `"Smart E-Commerce" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}

/**
 * Send password reset email with reset link
 */
async function sendPasswordResetEmail(email, resetToken, userName = 'User') {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart E-Commerce. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Password Reset Request',
    html
  });
}

/**
 * Send OTP email for passwordless login
 */
async function sendOtpEmail(email, otp, userName = 'User') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Login OTP</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Use the following One-Time Password (OTP) to log in to your account:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>You have 3 attempts to enter the correct OTP.</p>
          <p>If you didn't request this OTP, please ignore this email and secure your account.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart E-Commerce. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Your Login OTP Code',
    html
  });
}

module.exports = { sendMail, sendPasswordResetEmail, sendOtpEmail };
