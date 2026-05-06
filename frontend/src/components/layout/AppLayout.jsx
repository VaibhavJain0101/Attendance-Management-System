import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import NotificationCenter from './NotificationCenter';
import { useRealtimeNotifications } from '../../features/notifications/useRealtimeNotifications';

const AppLayout = () => {
  const { isConnected, refreshTick } = useRealtimeNotifications();

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
        <NotificationCenter isConnected={isConnected} refreshTick={refreshTick} />
      </main>
    </div>
  );
};

export default AppLayout;
