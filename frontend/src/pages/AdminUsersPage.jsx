import { useState } from 'react';
import { Users } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useCreateUserMutation, useGetUsersQuery } from '../features/users/usersApi';
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

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const usersQuery = useGetUsersQuery({ page, limit: 10 });
  const [createUser, createUserState] = useCreateUserMutation();

  const users = usersQuery.data?.data || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createUser(form).unwrap();
      setMessage('User created successfully.');
      setForm({ name: '', email: '', password: '', role: 'employee' });
    } catch (apiError) {
      setError(apiError?.data?.message || 'Failed to create user.');
    }
  };

  if (usersQuery.isLoading) return <Loading label="Loading users..." />;
  if (usersQuery.error) return <ErrorMessage message={usersQuery.error?.data?.message} />;

  return (
    <div className="stack">
      <PageHeader title="User Management" description="Create users and monitor active accounts." />

      <div className="stats-grid">
        <StatCard title="Total Users" value={usersQuery.data?.meta?.total || users.length} icon={Users} tone="blue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={handleSubmit}>
            <FormRow>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </FormRow>

            <FormRow>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </FormRow>

            <FormRow>
              <Label>Role</Label>
              <Select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="employee">employee</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </Select>
            </FormRow>

            {error ? <FieldMessage tone="error">{error}</FieldMessage> : null}
            {message ? <FieldMessage tone="success">{message}</FieldMessage> : null}
            <Button type="submit" disabled={createUserState.isLoading}>
              {createUserState.isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table className="min-w-[640px]">
              <TableHead>
                <tr><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Email</TableHeaderCell><TableHeaderCell>Role</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell></tr>
              </TableHead>
              <tbody>
                {users.map((u) => (
                  <TableRow key={u._id}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role}</TableCell><TableCell><Badge variant={u.isActive ? 'default' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></TableCell></TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;