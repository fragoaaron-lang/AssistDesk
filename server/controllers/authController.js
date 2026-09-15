const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Department, PasswordResetToken } = require('../models');
const { sendPasswordResetEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'assistdesk-secret';
const JWT_EXPIRES_IN = '8h';

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  account_status: user.account_status || 'active',
  department_id: user.department_id || null,
  department_name: user.role === 'student' ? (user.Department?.name || null) : null,
  student_number: user.student_number || null,
  profile_picture: user.profile_picture || null,
  facial_id: user.facial_id || null,
  created_at: user.created_at,
});

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STUDENT_NUMBER_PATTERN = /^(\d{4})-\d{5}$/;
const PUBLIC_ROLES = ['student', 'faculty', 'staff'];
const FACULTY_DEPARTMENTS = [
  'Basic Education Department',
  'College of Nursing',
  'CS',
  'CBA',
  'CHARM',
  'College of Criminology',
  'College of Physical Therapy',
  'Education Department',
];
const STAFF_DEPARTMENTS = [
  'Maintenance Department',
  'Accounting Department',
  'Registrar Department',
  'Library',
  'Guidance',
  'Office of Student Affairs',
  'Clinic',
  'IT Department',
];

const validatePassword = (password) => {
  if (!PASSWORD_POLICY.test(password)) {
    return 'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.';
  }

  return null;
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, department_id: user.department_id || null }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const verifyIdentity = async ({ idDocument, selfie }) => {
  const verificationUrl = process.env.FACE_VERIFICATION_URL;
  if (!verificationUrl) {
    return { available: false, matched: false };
  }

  const response = await fetch(verificationUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_document: idDocument, selfie }),
  });

  if (!response.ok) {
    throw new Error(`Identity provider returned ${response.status}`);
  }

  const result = await response.json();
  return {
    available: true,
    matched: result.match === true && Number(result.confidence || 0) >= 0.8,
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', department_id, student_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.split(/\s+/).length < 3) {
      return res.status(400).json({ message: 'First name, middle initial, and last name are required.' });
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Administrator accounts are created by the system developer.' });
    }
    let departmentId = null;
    if (role === 'student' || role === 'faculty' || role === 'staff') {
      departmentId = Number(department_id);
      if (!Number.isInteger(departmentId) || departmentId <= 0) {
        return res.status(400).json({ message: 'Please select your department.' });
      }
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({ message: 'Selected department is invalid.' });
      }
      if (role === 'faculty' && !FACULTY_DEPARTMENTS.includes(department.name)) {
        return res.status(400).json({ message: 'Faculty must select a college or Basic Education department.' });
      }
      if (role === 'staff' && !STAFF_DEPARTMENTS.includes(department.name)) {
        return res.status(400).json({ message: 'Staff must select a working department.' });
      }
    }

    if (role === 'student') {
      const normalizedStudentNumber = String(student_number || '').trim();
      const studentNumberMatch = normalizedStudentNumber.match(STUDENT_NUMBER_PATTERN);
      if (!studentNumberMatch || Number(studentNumberMatch[1]) > new Date().getFullYear()) {
        return res.status(400).json({ message: 'Student number must use a valid academic year. It should follow the format 2026-XXXXX.' });
      }
    }
    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password_hash,
      role,
      department_id: departmentId,
      student_number: role === 'student' ? student_number.trim() : null,
      account_status: 'pending_verification',
      verification_token: crypto.randomBytes(32).toString('hex'),
    });

    return res.status(201).json({
      message: 'Registration details saved. Identity verification is required.',
      verification_token: user.verification_token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed.' });
  }
};

exports.verifyRegistration = async (req, res) => {
  try {
    const { verification_token, id_document, selfie } = req.body || {};
    if (!verification_token || !id_document || !selfie) {
      return res.status(400).json({ message: 'ID document and facial verification are required.' });
    }

    const user = await User.findOne({
      where: { verification_token, account_status: 'pending_verification' },
      include: [{ model: Department }],
    });
    if (!user) {
      return res.status(400).json({ message: 'This registration session is invalid or has expired.' });
    }

    let verificationResult;
    try {
      verificationResult = await verifyIdentity({ idDocument: id_document, selfie });
    } catch (error) {
      console.error('Identity provider error:', error.message);
      return res.status(502).json({ message: 'Identity verification is temporarily unavailable. Please try again.' });
    }

    if (!verificationResult.available) {
      return res.status(503).json({ message: 'Identity verification is not configured. Registration cannot be completed.' });
    }

    if (!verificationResult.matched) {
      await user.update({ account_status: 'verification_failed', facial_id: null, verification_token: null });
      return res.status(422).json({ message: 'The ID and facial image do not appear to belong to the same person. Registration was not completed.' });
    }

    await user.update({ account_status: 'active', facial_id: selfie, verification_token: null });
    await user.reload({ include: [{ model: Department }] });
    const token = signToken(user);

    return res.status(200).json({ message: 'Identity verified. Registration complete.', token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to complete identity verification.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail }, include: [{ model: Department }] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.account_status === 'terminated') {
      return res.status(403).json({ message: 'This account has been terminated. Please contact an administrator for assistance.' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ message: 'This account has not completed identity verification.' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: [{ model: Department }] });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load profile.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.destroy({ where: { email: normalizedEmail } });
    await PasswordResetToken.create({ email: normalizedEmail, token, expires_at });

    await sendPasswordResetEmail({
      to: normalizedEmail,
      token,
      userName: user.name,
    });

    return res.json({ message: 'Password reset instructions have been sent to your email.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to process password reset.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const resetRecord = await PasswordResetToken.findOne({ where: { token } });
    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      await resetRecord.destroy();
      return res.status(400).json({ message: 'Reset token has expired.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.update({ password_hash }, { where: { email: resetRecord.email } });
    await resetRecord.destroy();

    return res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reset password.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash });

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to change password.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ message: 'Current password is required to delete your account.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const tickets = await user.getTickets ? await user.getTickets() : [];
    const ticketIds = tickets.map((ticket) => ticket.id);

    if (ticketIds.length) {
      await require('../models').TicketUpdate.destroy({ where: { ticket_id: ticketIds } });
      await require('../models').Ticket.destroy({ where: { id: ticketIds } });
    }

    await require('../models').Notification.destroy({ where: { user_id: user.id } });
    await require('../models').ChatLog.destroy({ where: { user_id: user.id } });
    await require('../models').Admin.destroy({ where: { user_id: user.id } });
    await require('../models').PasswordResetToken.destroy({ where: { email: user.email } });

    await user.destroy();

    return res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete account.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { profile_picture, student_number, facial_id } = req.body;

    if (profile_picture === undefined && student_number === undefined && facial_id === undefined) {
      return res.status(400).json({ message: 'Profile updates are required.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextValue = profile_picture === undefined
      ? user.profile_picture
      : profile_picture ? String(profile_picture).trim() : null;
    const nextStudentNumber = student_number === undefined
      ? user.student_number
      : student_number ? String(student_number).trim() : null;
    const nextFacialId = facial_id === undefined
      ? user.facial_id
      : facial_id ? String(facial_id).trim() : null;

    if (user.role === 'student' && !nextStudentNumber) {
      return res.status(400).json({ message: 'Student number is required for student accounts.' });
    }

    await user.update({ profile_picture: nextValue, student_number: nextStudentNumber, facial_id: nextFacialId });

    return res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
};
