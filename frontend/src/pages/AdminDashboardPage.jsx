import { useMemo, useState } from 'react';
import { ShieldCheck, UserCheck2, Users } from 'lucide-react';
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
import { useGetActiveOfficesQuery } from '../features/geofence/geofenceApi';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FormRow, Label, FieldMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { extractApiErrorMessage } from '../utils/apiError';

const defaultCreateForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  managerId: '',
  assignedOfficeId: ''
};

const AdminDashboardPage = () => {
  const [userPage, setUserPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState('');
  const [createError, setCreateError] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [updateForm, setUpdateForm] = useState({
    role: 'employee',
    managerId: '',
    assignedOfficeId: '',
    isActive: true
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [resetForm, setResetForm] = useState({ userId: '', newPassword: '', confirmPassword: '' });
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const usersQuery = useGetUsersQuery({ page: userPage, limit: 10 });
  const attendanceQuery = useGetAttendanceQuery({ page: attendancePage, limit: 10 });
  const managerQuery = useGetUsersQuery({ page: 1, limit: 100, role: 'manager' });
  const adminQuery = useGetUsersQuery({ page: 1, limit: 100, role: 'admin' });
  const officesQuery = useGetActiveOfficesQuery();

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
        ...(createForm.role === 'employee' && createForm.managerId ? { managerId: createForm.managerId } : {}),
        ...(createForm.assignedOfficeId ? { assignedOfficeId: createForm.assignedOfficeId } : {})
      }).unwrap();
      setCreateMessage('User created successfully.');
      setCreateForm(defaultCreateForm);
    } catch (error) {
      setCreateError(extractApiErrorMessage(error, 'Failed to create user.'));
    }
  };

  const onSelectUser = (userId) => {
    setSelectedUserId(userId);
    setUpdateError('');
    setUpdateMessage('');

    const selectedUser = users.find((item) => item._id === userId);
    if (!selectedUser) {
      setUpdateForm({ role: 'employee', managerId: '', assignedOfficeId: '', isActive: true });
      return;
    }

    setUpdateForm({
      role: selectedUser.role,
      managerId: selectedUser.manager?._id || '',
      assignedOfficeId: selectedUser.assignedOffice?._id || '',
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
          assignedOfficeId: updateForm.assignedOfficeId || null,
          isActive: updateForm.isActive
        }
      }).unwrap();
      setUpdateMessage('User updated successfully.');
    } catch (error) {
      setUpdateError(extractApiErrorMessage(error, 'Failed to update user.'));
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
      setResetError(extractApiErrorMessage(error, 'Failed to reset password.'));
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
      <PageHeader
        title="Admin Dashboard"
        description="Manage user access, credentials, and monitor organization-wide attendance records."
      />

      <div className="stats-grid">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} tone="blue" />
        <StatCard title="Employees" value={stats.employees} icon={UserCheck2} tone="emerald" />
        <StatCard title="Managers" value={stats.managers} icon={ShieldCheck} tone="amber" />
      </div>
       
       <PageHeader
        title="User Management"
        description="Create users and monitor active accounts."
      />
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleCreateUser}>
            <FormRow>
              <Label htmlFor="createName">Name</Label>
              <Input
                id="createName"
                type="text"
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="createEmail">Email</Label>
              <Input
                id="createEmail"
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="createPassword">Password</Label>
              <Input
                id="createPassword"
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="createRole">Role</Label>
              <Select
                id="createRole"
                value={createForm.role}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value, managerId: '' }))}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            </FormRow>

            {createForm.role === 'employee' ? (
              <FormRow>
                <Label htmlFor="createManager">Manager (Optional)</Label>
              <Select
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
              </Select>
            </FormRow>
          ) : null}

            <FormRow>
              <Label htmlFor="createOffice">Assigned Office (Optional)</Label>
              <Select
                id="createOffice"
                value={createForm.assignedOfficeId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, assignedOfficeId: event.target.value }))}
              >
                <option value="">Unassigned</option>
                {(officesQuery.data?.data || []).map((office) => (
                  <option key={office._id} value={office._id}>
                    {office.officeName}
                  </option>
                ))}
              </Select>
            </FormRow>

            {createError ? <FieldMessage tone="error">{createError}</FieldMessage> : null}
            {createMessage ? <FieldMessage tone="success">{createMessage}</FieldMessage> : null}

            <Button type="submit" disabled={createUserState.isLoading}>
              {createUserState.isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update User Role/Status</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleUpdateUser}>
            <FormRow>
              <Label htmlFor="updateUser">User</Label>
              <Select id="updateUser" value={selectedUserId} onChange={(event) => onSelectUser(event.target.value)}>
                <option value="">Select user</option>
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} - {item.email}
                  </option>
                ))}
              </Select>
            </FormRow>

            <FormRow>
              <Label htmlFor="updateRole">Role</Label>
              <Select
                id="updateRole"
                value={updateForm.role}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, role: event.target.value, managerId: '' }))}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            </FormRow>

            {updateForm.role === 'employee' ? (
              <FormRow>
                <Label htmlFor="updateManager">Manager (Optional)</Label>
                <Select
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
                </Select>
              </FormRow>
            ) : null}

            <FormRow>
              <Label htmlFor="updateOffice">Assigned Office (Optional)</Label>
              <Select
                id="updateOffice"
                value={updateForm.assignedOfficeId}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, assignedOfficeId: event.target.value }))}
              >
                <option value="">Unassigned</option>
                {(officesQuery.data?.data || []).map((office) => (
                  <option key={office._id} value={office._id}>
                    {office.officeName}
                  </option>
                ))}
              </Select>
            </FormRow>

            <FormRow>
              <Label htmlFor="updateActive">Status</Label>
              <Select
                id="updateActive"
                value={String(updateForm.isActive)}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormRow>

            {updateError ? <FieldMessage tone="error">{updateError}</FieldMessage> : null}
            {updateMessage ? <FieldMessage tone="success">{updateMessage}</FieldMessage> : null}

            <Button type="submit" disabled={updateUserState.isLoading}>
              {updateUserState.isLoading ? 'Updating...' : 'Update User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset User Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleResetPassword}>
            <FormRow>
              <Label htmlFor="resetUserId">User</Label>
              <Select
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
              </Select>
            </FormRow>

            <FormRow>
              <Label htmlFor="resetPassword">New Password</Label>
              <Input
                id="resetPassword"
                type="password"
                value={resetForm.newPassword}
                onChange={(event) => setResetForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label htmlFor="resetConfirmPassword">Confirm New Password</Label>
              <Input
                id="resetConfirmPassword"
                type="password"
                value={resetForm.confirmPassword}
                onChange={(event) => setResetForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                required
              />
            </FormRow>

            {resetError ? <FieldMessage tone="error">{resetError}</FieldMessage> : null}
            {resetMessage ? <FieldMessage tone="success">{resetMessage}</FieldMessage> : null}

            <Button type="submit" disabled={resetUserPasswordState.isLoading}>
              {resetUserPasswordState.isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table className="min-w-[700px]">
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Manager</TableHeaderCell>
                  <TableHeaderCell>Office</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.manager ? `${user.manager.name} (${user.manager.role})` : '-'}</TableCell>
                    <TableCell>{user.assignedOffice?.officeName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={userPage === 1} onClick={() => setUserPage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {userPage}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setUserPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable rows={attendanceQuery.data?.data || []} />
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={attendancePage === 1} onClick={() => setAttendancePage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {attendancePage}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setAttendancePage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
