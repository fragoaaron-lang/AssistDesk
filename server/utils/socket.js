const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

let io = null;
const JWT_SECRET = process.env.JWT_SECRET || 'assistdesk-secret';

const createSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      socket.data.departmentId = payload.department_id || null;
      socket.join(`user_${payload.id}`);
      if (payload.role === 'admin') {
        socket.join('admins');
        if (payload.department_id) {
          socket.join(`department_admin_${payload.department_id}`);
        }
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

const notifyAllUsers = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

module.exports = {
  createSocketServer,
  notifyUser,
  notifyAdmins,
  notifyDepartmentAdmins,
  notifyAllUsers,
};
