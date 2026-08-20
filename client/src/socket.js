import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  if (!token) {
    socket = null;
    return null;
  }

  socket = io(API_BASE_URL, {
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
