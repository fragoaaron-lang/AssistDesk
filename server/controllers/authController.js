const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, PasswordResetToken } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'assistdesk-secret';
const JWT_EXPIRES_IN = '8h';

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department_id: user.department_id || null,
  profile_picture: user.profile_picture || null,
  created_at: user.created_at,
});

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PUBLIC_ROLES = ['student', 'faculty', 'staff'];

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

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', department_id } = req.body;

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
      department_id: null,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
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
    const user = await User.findByPk(req.user.id);
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

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.destroy({ where: { email } });
    await PasswordResetToken.create({ email, token, expires_at });

    return res.json({
      message: 'Password reset token created.',
      resetToken: token,
    });
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

exports.updateProfile = async (req, res) => {
  try {
    const { profile_picture } = req.body;

    if (profile_picture === undefined) {
      return res.status(400).json({ message: 'Profile picture data is required.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextValue = profile_picture ? String(profile_picture).trim() : null;
    await user.update({ profile_picture: nextValue });

    return res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
};
