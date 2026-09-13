const nodemailer = require('nodemailer');

const buildResetLink = (token) => {
  const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3005').replace(/\/$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

const sendPasswordResetEmail = async ({ to, token, userName }) => {
  const resetLink = buildResetLink(token);
  const host = process.env.MAIL_HOST;
  const username = process.env.MAIL_USER;
  const password = process.env.MAIL_PASS;

  if (!host || !username || !password) {
    console.log(`[Password reset] Email not configured. To: ${to}`);
    console.log(`[Password reset] Reset link: ${resetLink}`);
    return { success: true, devMode: true, resetLink };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || 'false') === 'true',
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const fromAddress = process.env.MAIL_FROM || username;

  await transporter.sendMail({
    from: fromAddress,
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
  buildResetLink,
};
