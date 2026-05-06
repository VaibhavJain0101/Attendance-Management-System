import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import NotificationCenter from './NotificationCenter';
import { useRealtimeNotifications } from '../../features/notifications/useRealtimeNotifications';
import { authLoggedOut } from '../../features/auth/authSlice';
import { ROLES } from '../../utils/constants';

const linksByRole = {
  [ROLES.EMPLOYEE]: [
    { to: '/employee', label: 'Dashboard' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/reports', label: 'Reports' },
    { to: '/account', label: 'Account' }
  ],
  [ROLES.MANAGER]: [
    { to: '/manager', label: 'Dashboard' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/reports', label: 'Reports' },
    { to: '/account', label: 'Account' }
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/geofence', label: 'Geofence' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/reports', label: 'Reports' },
    { to: '/account', label: 'Account' }
  ]
};

const AppLayout = () => {
  const { isConnected, refreshTick } = useRealtimeNotifications();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user ? linksByRole[user.role] || [] : [];

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] gap-4 p-3 sm:gap-5 sm:p-5">
        <AppSidebar
          links={links}
          user={user}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => dispatch(authLoggedOut())}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className="app-main !max-w-none !p-0">
            <Outlet />
            <NotificationCenter isConnected={isConnected} refreshTick={refreshTick} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
