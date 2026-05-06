import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { authLoggedIn } from '../features/auth/authSlice';
import { useLoginMutation } from '../features/auth/authApi';
import { ROLES } from '../utils/constants';

const LoginPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const location = useLocation();
  const role = String(user?.role || '').toLowerCase();

  if (isAuthenticated && user) {
    if (role === ROLES.EMPLOYEE) return <Navigate to="/employee" replace />;
    if (role === ROLES.MANAGER) return <Navigate to="/manager" replace />;
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await login(form).unwrap();
      dispatch(authLoggedIn(response.data));
    } catch (apiError) {
      setError(apiError?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Attendance Management System</h1>
        <p>Please sign in to continue.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        {error ? <p className="error-text">{error}</p> : null}
        {location.state?.from ? <p className="small">Login required to access requested page.</p> : null}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
