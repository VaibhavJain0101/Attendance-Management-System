import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { authLoggedIn } from '../features/auth/authSlice';
import { useLoginMutation } from '../features/auth/authApi';
import { ROLES } from '../utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FormRow, Label } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

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
      <Card className="auth-card !rounded-3xl !p-0">
        <CardHeader className="mb-0 border-b border-slate-200/80 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Attendance Management</p>
              <CardTitle className="mt-1 text-2xl">Welcome Back</CardTitle>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Please sign in to continue.</p>
        </CardHeader>

        <CardContent className="p-6">
          <form className="form-grid" onSubmit={handleSubmit}>
            <FormRow>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </FormRow>

            {error ? <p className="error-text">{error}</p> : null}
            {location.state?.from ? <p className="small">Login required to access requested page.</p> : null}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;