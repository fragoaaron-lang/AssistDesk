import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  if (!token) {
    socket = null;
    return null;
  }

  socket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
