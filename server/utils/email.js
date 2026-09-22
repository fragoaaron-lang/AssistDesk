const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateVerificationCode = () => String(crypto.randomInt(10000000, 100000000));

const buildResetLink = (token) => {
  const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://assist-desk-ebon.vercel.app').replace(/\/$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

const buildEmailVerificationLink = (token) => {
  const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://assist-desk-ebon.vercel.app').replace(/\/$/, '');
  return `${baseUrl}/verify-email/${encodeURIComponent(token)}`;
};

const sendEmail = async ({ to, subject, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_FROM_NAME || 'AssistDesk',
          email: process.env.BREVO_FROM_EMAIL || process.env.MAIL_USER,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`Brevo email delivery failed (${response.status}): ${responseBody.slice(0, 300)}`);
    }

    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || process.env.MAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`Resend email delivery failed (${response.status}): ${responseBody.slice(0, 300)}`);
    }

    return;
  }

  const transporter = createTransporter();
  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER;
  await transporter.sendMail({ from: fromAddress, to, subject, html });
};

const createTransporter = () => {
  const host = process.env.MAIL_HOST;
  const username = process.env.MAIL_USER;
  const password = process.env.MAIL_PASS;

  if (!host || !username || !password) {
    throw new Error('Email delivery is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || 'false') === 'true',
    auth: { user: username, pass: password },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendEmailVerificationEmail = async ({ to, code, userName }) => {
  await sendEmail({
    to,
    subject: 'Your AssistDesk verification code',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Verify your email address</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>Your AssistDesk verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 18px 0; color: #0f172a;">${code}</p>
        <p>Enter this 8-digit code in the AssistDesk verification page to activate your account.</p>
      </div>
      `,
  });
};

const sendPasswordResetEmail = async ({ to, token, userName }) => {
  const resetLink = buildResetLink(token);
  await sendEmail({
    to,
    subject: 'Reset your AssistDesk password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>We received a request to reset your AssistDesk password.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 8px;">Reset Password</a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
      </div>
      `,
  });

  return { success: true, devMode: false, resetLink };
};

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  generateVerificationCode,
  buildResetLink,
  buildEmailVerificationLink,
};
