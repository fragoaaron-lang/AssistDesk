const nodemailer = require('nodemailer');

const buildResetLink = (token) => {
  const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://assist-desk-ebon.vercel.app').replace(/\/$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

const buildEmailVerificationLink = (token) => {
  const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://assist-desk-ebon.vercel.app').replace(/\/$/, '');
  return `${baseUrl}/verify-email/${encodeURIComponent(token)}`;
};

const sendEmail = async ({ to, subject, html }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
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

const sendEmailVerificationEmail = async ({ to, token, userName }) => {
  const verificationLink = buildEmailVerificationLink(token);
  await sendEmail({
    to,
    subject: 'Verify your AssistDesk email address',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Verify your email address</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>Click the button below to verify your email and activate your AssistDesk account.</p>
        <p><a href="${verificationLink}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 8px;">Verify email</a></p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p>${verificationLink}</p>
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
  buildResetLink,
  buildEmailVerificationLink,
};
