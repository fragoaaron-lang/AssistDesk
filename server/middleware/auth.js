const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'assistdesk-secret';

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'department_id', 'account_status'],
    });
    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }

    req.user = {
      ...decoded,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id || null,
      account_status: user.account_status,
    };

    const isTerminatedAccountView = user.account_status === 'terminated'
      && req.baseUrl === '/api/auth' && req.path === '/me' && req.method === 'GET';
    if (user.account_status !== 'active' && !isTerminatedAccountView) {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Unable to verify account status.' });
    }
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
