import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

const HomeRedirectPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || '').toLowerCase();

  if (role === ROLES.EMPLOYEE) return <Navigate to="/employee" replace />;
  if (role === ROLES.MANAGER) return <Navigate to="/manager" replace />;
  return <Navigate to="/admin" replace />;
};

export default HomeRedirectPage;
