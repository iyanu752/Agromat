import  io  from 'socket.io-client';

export const socket = io('https://estate-run-1.onrender.com/', {
  query: {
    userId: 'user123',
  },
});