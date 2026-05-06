import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from './socketClient';
import { getStoredToken } from '../../utils/storage';

export const useRealtimeNotifications = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      disconnectSocket();
      return undefined;
    }

    const token = getStoredToken();
    const socket = connectSocket(token);

    if (!socket) {
      return undefined;
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onNotification = () => {
      setRefreshTick((prev) => prev + 1);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
      disconnectSocket();
    };
  }, [isAuthenticated]);

  return {
    isConnected,
    refreshTick
  };
};
