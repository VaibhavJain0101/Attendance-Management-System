import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
    { to: '/attendance', label: 'Attendance' },
    { to: '/reports', label: 'Reports' },
    { to: '/account', label: 'Account' }
  ]
};

const AppHeader = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();

  const links = user ? linksByRole[user.role] || [] : [];

  return (
    <header className="app-header">
      <div className="app-header__brand">Attendance Management</div>
      <nav className="app-header__nav">
        {links.map((link) => (
          <Link
            key={link.to}
            className={location.pathname.startsWith(link.to) ? 'active' : ''}
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="app-header__profile">
        <span>{user?.name}</span>
        <span className="badge">{user?.role}</span>
        <button type="button" onClick={() => dispatch(authLoggedOut())}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
