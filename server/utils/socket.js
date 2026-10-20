const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { User } = require('../models');
const { getAllowedOrigins, getJwtSecret } = require('../config/security');
const { getDepartmentScope } = require('./departmentScope');

let io = null;
const JWT_SECRET = getJwtSecret();

const createSocketServer = (server) => {
  const allowedOrigins = new Set(getAllowedOrigins());

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        try {
          if (allowedOrigins.has(new URL(origin).origin)) {
            callback(null, true);
            return;
          }
        } catch {
          // Deny malformed origins below.
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: false,
    },
  });

  io.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'assistdesk',
        audience: 'assistdesk-client',
      });
      const user = await User.findByPk(payload.id, { attributes: ['id', 'role', 'department_id', 'account_status', 'session_version'] });
      if (!user || user.account_status !== 'active' || Number(payload.session_version || 0) !== Number(user.session_version || 0)) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.departmentId = user.department_id || null;
      socket.join(`user_${user.id}`);
      if (user.role === 'admin' && !getDepartmentScope(user)) {
        socket.join('admins');
      } else if (user.role === 'admin' && user.department_id) {
        socket.join(`department_admin_${user.department_id}`);
      } else if (user.role === 'staff' && user.department_id) {
        socket.join(`department_staff_${user.department_id}`);
      }
    } catch (error) {
      socket.disconnect(true);
    }
  });

  return io;
};

const notifyUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
};

const notifyAdmins = (event, payload) => {
  if (!io) return;
  io.to('admins').emit(event, payload);
};

const notifyDepartmentAdmins = (departmentId, event, payload) => {
  if (!io || !departmentId) return;
  io.to(`department_admin_${departmentId}`).emit(event, payload);
};

const notifyDepartmentStaff = (departmentId, event, payload) => {
  if (!io || !departmentId) return;
  io.to(`department_staff_${departmentId}`).emit(event, payload);
};

const moveStaffDepartmentRoom = (userId, oldDepartmentId, newDepartmentId) => {
  if (!io || !userId) return;
  const userRoom = `user_${userId}`;
  if (oldDepartmentId) io.in(userRoom).socketsLeave(`department_staff_${oldDepartmentId}`);
  if (newDepartmentId) io.in(userRoom).socketsJoin(`department_staff_${newDepartmentId}`);
};

const notifyAllUsers = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

const disconnectUser = (userId) => {
  if (!io || !userId) return;
  io.in(`user_${userId}`).disconnectSockets(true);
};

module.exports = {
  createSocketServer,
  notifyUser,
  notifyAdmins,
  notifyDepartmentAdmins,
  notifyDepartmentStaff,
  moveStaffDepartmentRoom,
  notifyAllUsers,
  disconnectUser,
};
