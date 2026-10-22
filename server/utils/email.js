const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getFrontendUrl } = require('../config/security');

const generateVerificationCode = () => String(crypto.randomInt(10000000, 100000000));
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const buildResetLink = (token) => {
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
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
    tls: { rejectUnauthorized: true },
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
        <p>Hello ${escapeHtml(userName || 'there')},</p>
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
        <p>Hello ${escapeHtml(userName || 'there')},</p>
        <p>We received a request to reset your AssistDesk password.</p>
        <p>
          <a href="${escapeHtml(resetLink)}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 8px;">Reset Password</a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p>${escapeHtml(resetLink)}</p>
        <p>This link will expire in 1 hour.</p>
      </div>
      `,
  });

  return { success: true, devMode: false, resetLink };
};

const sendTicketEtaExpiredEmail = async ({ to, userName, ticketSubject, ticketId, eta }) => {
  const etaLabel = new Date(eta).toLocaleString();
  await sendEmail({
    to,
    subject: `ETA lapsed for ticket #${ticketId || 'N/A'}: ${ticketSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 680px; margin: 0 auto;">
        <h2 style="margin-bottom: 12px; color: #b91c1c;">Ticket ETA missed</h2>
        <p>Hello ${escapeHtml(userName || 'there')},</p>
        <p>The request <strong>${escapeHtml(ticketSubject)}</strong> was not resolved before its ETA of <strong>${escapeHtml(etaLabel)}</strong>.</p>
        <p>As a result, the ticket has been automatically escalated to <strong>urgent</strong> priority and requires immediate attention.</p>
        <p>Please review the ticket and take the next action without delay.</p>
      </div>
    `,
  });
};

const buildAccountAppealEmail = ({ userName, userEmail, role, departmentName, terminationReason, appealMessage }) => ({
  subject: 'AssistDesk account termination appeal',
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 680px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px; color: #0f2d52;">Account termination appeal</h2>
      <p>A terminated AssistDesk user submitted an appeal.</p>
      <dl>
        <dt><strong>Name</strong></dt><dd>${escapeHtml(userName)}</dd>
        <dt><strong>Email</strong></dt><dd>${escapeHtml(userEmail)}</dd>
        <dt><strong>Role</strong></dt><dd>${escapeHtml(role)}</dd>
        <dt><strong>Department</strong></dt><dd>${escapeHtml(departmentName || 'Not assigned')}</dd>
      </dl>
      <p><strong>Recorded termination reason</strong></p>
      <p>${escapeHtml(terminationReason || 'No reason was recorded.').replace(/\n/g, '<br>')}</p>
      <p><strong>Appeal statement</strong></p>
      <p>${escapeHtml(appealMessage).replace(/\n/g, '<br>')}</p>
    </div>
  `,
});

const sendAccountAppealEmail = async ({ to, ...appeal }) => {
  const message = buildAccountAppealEmail(appeal);
  await sendEmail({ to, ...message });
};

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendTicketEtaExpiredEmail,
  sendAccountAppealEmail,
  buildAccountAppealEmail,
  generateVerificationCode,
  buildResetLink,
  escapeHtml,
};
