import { useState } from 'react';
import { useChangePasswordMutation } from '../features/auth/authApi';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormRow, Label, FieldMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';

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
      <PageHeader title="Account Settings" description="Update your account credentials securely." />
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleSubmit}>
            <FormRow>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                required
              />
            </FormRow>

            {error ? <FieldMessage tone="error">{error}</FieldMessage> : null}
            {message ? <FieldMessage tone="success">{message}</FieldMessage> : null}

            <Button type="submit" disabled={changePasswordState.isLoading}>
              {changePasswordState.isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;