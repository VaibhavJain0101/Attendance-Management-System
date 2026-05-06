import { useMemo, useState } from 'react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AttendanceTable from '../components/common/AttendanceTable';
import { useGetAttendanceQuery } from '../features/attendance/attendanceApi';
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useResetUserPasswordMutation,
  useUpdateUserMutation
} from '../features/users/usersApi';

const defaultCreateForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  managerId: ''
};

const AdminDashboardPage = () => {
  const [userPage, setUserPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [updateForm, setUpdateForm] = useState({ role: 'employee', managerId: '', isActive: true });
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [resetForm, setResetForm] = useState({ userId: '', newPassword: '', confirmPassword: '' });
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const usersQuery = useGetUsersQuery({ page: userPage, limit: 10 });
  const attendanceQuery = useGetAttendanceQuery({ page: attendancePage, limit: 10 });
  const managerQuery = useGetUsersQuery({ page: 1, limit: 100, role: 'manager' });
  const adminQuery = useGetUsersQuery({ page: 1, limit: 100, role: 'admin' });

  const [createUser, createUserState] = useCreateUserMutation();
  const [updateUser, updateUserState] = useUpdateUserMutation();
  const [resetUserPassword, resetUserPasswordState] = useResetUserPasswordMutation();

  const users = usersQuery.data?.data || [];

  const managerOptions = useMemo(() => {
    const managers = managerQuery.data?.data || [];
    const admins = adminQuery.data?.data || [];
    const combined = [...managers, ...admins];
    const map = new Map();
    combined.forEach((user) => map.set(user._id, user));
    return Array.from(map.values());
  }, [managerQuery.data, adminQuery.data]);

  const stats = useMemo(() => {
    return {
      totalUsers: usersQuery.data?.meta?.total || users.length,
      employees: users.filter((u) => u.role === 'employee').length,
      managers: users.filter((u) => u.role === 'manager').length
    };
  }, [usersQuery.data, users]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreateError('');
    setCreateMessage('');

    try {
      await createUser({
        ...createForm,
        ...(createForm.role === 'employee' && createForm.managerId ? { managerId: createForm.managerId } : {})
      }).unwrap();
      setCreateMessage('User created successfully.');
      setCreateForm(defaultCreateForm);
    } catch (error) {
      setCreateError(error?.data?.message || 'Failed to create user.');
    }
  };

  const onSelectUser = (userId) => {
    setSelectedUserId(userId);
    setUpdateError('');
    setUpdateMessage('');

    const selectedUser = users.find((item) => item._id === userId);
    if (!selectedUser) {
      setUpdateForm({ role: 'employee', managerId: '', isActive: true });
      return;
    }

    setUpdateForm({
      role: selectedUser.role,
      managerId: selectedUser.manager?._id || '',
      isActive: selectedUser.isActive
    });
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
      setUpdateError('Select a user to update.');
      return;
    }

    setUpdateError('');
    setUpdateMessage('');

    try {
      await updateUser({
        userId: selectedUserId,
        body: {
          role: updateForm.role,
          managerId: updateForm.role === 'employee' ? updateForm.managerId || null : null,
          isActive: updateForm.isActive
        }
      }).unwrap();
      setUpdateMessage('User updated successfully.');
    } catch (error) {
      setUpdateError(error?.data?.message || 'Failed to update user.');
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetMessage('');
    setResetError('');

    if (!resetForm.userId) {
      setResetError('Select a user to reset password.');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('Confirm password must match new password.');
      return;
    }

    try {
      await resetUserPassword({
        userId: resetForm.userId,
        body: {
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword
        }
      }).unwrap();
      setResetMessage('Password reset successfully.');
      setResetForm({ userId: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setResetError(error?.data?.message || 'Failed to reset password.');
    }
  };

  if (usersQuery.isLoading || attendanceQuery.isLoading) {
    return <Loading label="Loading admin dashboard..." />;
  }

  if (usersQuery.error) {
    return <ErrorMessage message={usersQuery.error?.data?.message} />;
  }

  return (
    <div className="stack">
      <h2>Admin Dashboard</h2>
      <div className="stats-grid">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Employees" value={stats.employees} />
        <StatCard title="Managers" value={stats.managers} />
      </div>

      <section className="card">
        <h3>Create User</h3>
        <form className="form-grid" onSubmit={handleCreateUser}>
          <label htmlFor="createName">Name</label>
          <input
            id="createName"
            type="text"
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <label htmlFor="createEmail">Email</label>
          <input
            id="createEmail"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />

          <label htmlFor="createPassword">Password</label>
          <input
            id="createPassword"
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />

          <label htmlFor="createRole">Role</label>
          <select
            id="createRole"
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value, managerId: '' }))}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

          {createForm.role === 'employee' ? (
            <>
              <label htmlFor="createManager">Manager (Optional)</label>
              <select
                id="createManager"
                value={createForm.managerId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, managerId: event.target.value }))}
              >
                <option value="">No manager</option>
                {managerOptions.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.name} ({option.role})
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {createError ? <p className="error-text">{createError}</p> : null}
          {createMessage ? <p className="success-text">{createMessage}</p> : null}

          <button type="submit" disabled={createUserState.isLoading}>
            {createUserState.isLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Update User Role/Status</h3>
        <form className="form-grid" onSubmit={handleUpdateUser}>
          <label htmlFor="updateUser">User</label>
          <select id="updateUser" value={selectedUserId} onChange={(event) => onSelectUser(event.target.value)}>
            <option value="">Select user</option>
            {users.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.email}
              </option>
            ))}
          </select>

          <label htmlFor="updateRole">Role</label>
          <select
            id="updateRole"
            value={updateForm.role}
            onChange={(event) => setUpdateForm((prev) => ({ ...prev, role: event.target.value, managerId: '' }))}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

          {updateForm.role === 'employee' ? (
            <>
              <label htmlFor="updateManager">Manager (Optional)</label>
              <select
                id="updateManager"
                value={updateForm.managerId}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, managerId: event.target.value }))}
              >
                <option value="">No manager</option>
                {managerOptions.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.name} ({option.role})
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <label htmlFor="updateActive">Status</label>
          <select
            id="updateActive"
            value={String(updateForm.isActive)}
            onChange={(event) => setUpdateForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {updateError ? <p className="error-text">{updateError}</p> : null}
          {updateMessage ? <p className="success-text">{updateMessage}</p> : null}

          <button type="submit" disabled={updateUserState.isLoading}>
            {updateUserState.isLoading ? 'Updating...' : 'Update User'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Reset User Password</h3>
        <form className="form-grid" onSubmit={handleResetPassword}>
          <label htmlFor="resetUserId">User</label>
          <select
            id="resetUserId"
            value={resetForm.userId}
            onChange={(event) => setResetForm((prev) => ({ ...prev, userId: event.target.value }))}
          >
            <option value="">Select user</option>
            {users.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.email}
              </option>
            ))}
          </select>

          <label htmlFor="resetPassword">New Password</label>
          <input
            id="resetPassword"
            type="password"
            value={resetForm.newPassword}
            onChange={(event) => setResetForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            required
          />

          <label htmlFor="resetConfirmPassword">Confirm New Password</label>
          <input
            id="resetConfirmPassword"
            type="password"
            value={resetForm.confirmPassword}
            onChange={(event) => setResetForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            required
          />

          {resetError ? <p className="error-text">{resetError}</p> : null}
          {resetMessage ? <p className="success-text">{resetMessage}</p> : null}

          <button type="submit" disabled={resetUserPasswordState.isLoading}>
            {resetUserPasswordState.isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Users</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.manager ? `${user.manager.name} (${user.manager.role})` : '-'}</td>
                  <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button type="button" disabled={userPage === 1} onClick={() => setUserPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {userPage}</span>
          <button type="button" onClick={() => setUserPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </section>

      <section className="card">
        <h3>All Attendance</h3>
        <AttendanceTable rows={attendanceQuery.data?.data || []} />
        <div className="pagination">
          <button type="button" disabled={attendancePage === 1} onClick={() => setAttendancePage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {attendancePage}</span>
          <button type="button" onClick={() => setAttendancePage((p) => p + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;

