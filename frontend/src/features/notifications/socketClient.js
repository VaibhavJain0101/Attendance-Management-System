import { io } from 'socket.io-client';

let socket;

export const connectSocket = (token) => {
  if (!token) {
    return null;
  }

  if (socket) {
    return socket;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');

  socket = io(baseUrl, {
    transports: ['websocket'],
    auth: {
      token
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
