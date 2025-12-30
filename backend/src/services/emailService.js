const nodemailer = require("nodemailer");

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function isTruthy(value) {
  if (value === true) return true;
  const v = String(value || "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes";
}

function getFromAddress() {
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || "Smart E-Commerce";
  if (!fromEmail) return undefined;
  return `"${fromName}" <${fromEmail}>`;
}

function buildTransportConfig() {
  // Prefer explicit SMTP configuration in production.
  // Env supported:
  // - EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS
  // Optional:
  // - EMAIL_PROVIDER=gmail
  // - EMAIL_SERVICE=gmail (legacy)
  const hasSmtpHost = !!process.env.EMAIL_HOST;

  if (hasSmtpHost) {
    const port = Number(process.env.EMAIL_PORT || (isTruthy(process.env.EMAIL_SECURE) ? 465 : 587));
    const secure = isTruthy(process.env.EMAIL_SECURE) || port === 465;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER/EMAIL_PASS for SMTP authentication");
    }

    return {
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  const provider = (process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || "gmail").toLowerCase().trim();
  if (provider === "gmail") {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER/EMAIL_PASS for Gmail SMTP (use an App Password in production)");
    }

    return {
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  throw new Error(
    "Email is not configured. Set EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS (SMTP) or EMAIL_PROVIDER=gmail with EMAIL_USER/EMAIL_PASS."
  );
}

let cachedTransporter = null;
let cachedTransporterKey = null;

function getTransporter() {
  const key = JSON.stringify({
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS ? "***" : "",
  });

  if (cachedTransporter && cachedTransporterKey === key) return cachedTransporter;

  const config = buildTransportConfig();
  cachedTransporter = nodemailer.createTransport({
    ...config,
    // Safer defaults for production; doesn't change behavior for most providers.
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

function formatSmtpError(error) {
  const code = error?.code;
  const response = error?.response;
  const responseCode = error?.responseCode;

  // Common Gmail production issue: using normal password instead of App Password.
  if (code === "EAUTH" || responseCode === 535) {
    return `${error.message}. SMTP auth failed (code=${code || responseCode}). If using Gmail, enable 2FA and use an App Password for EMAIL_PASS.`;
  }

  if (code) return `${error.message} (code=${code})`;
  if (response) return `${error.message} (response=${response})`;
  return error?.message || "Unknown email error";
}

async function sendMail({ to, subject, html, attachments = [] }) {
  const transporter = getTransporter();
  const from = getFromAddress();

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    if (process.env.NODE_ENV === "production") {
      console.log(`[Email] sent to=${to} messageId=${info?.messageId || "?"}`);
    }

    return info;
  } catch (error) {
    console.error("[Email] send failed:", formatSmtpError(error));
    throw error;
  }
}

/**
 * Send password reset email with reset link
 */
async function sendPasswordResetEmail(email, resetToken, userName = 'User') {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
  
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
