const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getJwtSecret } = require('../config/security');
const JWT_SECRET = getJwtSecret();

const isTerminatedAccountRouteAllowed = (req) => req.baseUrl === '/api/auth'
  && ((req.path === '/me' && req.method === 'GET')
    || (req.path === '/appeal' && req.method === 'POST')
    || (req.path === '/logout' && req.method === 'POST'));

const isStaffApprovalAccountRouteAllowed = (req, accountStatus) => {
  if (req.baseUrl !== '/api/auth') return false;
  if ((req.path === '/me' && req.method === 'GET') || (req.path === '/logout' && req.method === 'POST')) return true;
  return ['pending_id', 'id_rejected'].includes(accountStatus)
    && req.path === '/staff-id'
    && req.method === 'POST';
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'assistdesk',
      audience: 'assistdesk-client',
    });
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'department_id', 'account_status', 'session_version'],
    });
    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }
    if (Number(decoded.session_version || 0) !== Number(user.session_version || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    req.user = {
      ...decoded,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id || null,
      account_status: user.account_status,
    };

    const isTerminatedAccountRoute = user.account_status === 'terminated'
      && isTerminatedAccountRouteAllowed(req);
    const isPendingStaffAccountRoute = ['faculty', 'staff'].includes(user.role)
      && ['pending_id', 'pending_approval', 'id_rejected'].includes(user.account_status)
      && isStaffApprovalAccountRouteAllowed(req, user.account_status);
    if (user.account_status !== 'active' && !isTerminatedAccountRoute && !isPendingStaffAccountRoute) {
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

authMiddleware.isTerminatedAccountRouteAllowed = isTerminatedAccountRouteAllowed;
authMiddleware.isStaffApprovalAccountRouteAllowed = isStaffApprovalAccountRouteAllowed;

module.exports = authMiddleware;
