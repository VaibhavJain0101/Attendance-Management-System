import { useState } from 'react';
import { useChangePasswordMutation } from '../features/auth/authApi';

const defaultForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

const AccountPage = () => {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [changePassword, changePasswordState] = useChangePasswordMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Confirm password must match new password.');
      return;
    }

    try {
      await changePassword(form).unwrap();
      setMessage('Password changed successfully.');
      setForm(defaultForm);
    } catch (apiError) {
      setError(apiError?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="stack">
      <h2>Account Settings</h2>
      <section className="card">
        <h3>Change Password</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            required
          />

          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            required
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            required
          />

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}

          <button type="submit" disabled={changePasswordState.isLoading}>
            {changePasswordState.isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AccountPage;
