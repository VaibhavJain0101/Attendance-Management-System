import { useState } from 'react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useCreateUserMutation, useGetUsersQuery } from '../features/users/usersApi';

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
      <h2>User Management</h2>
      <div className="stats-grid">
        <StatCard title="Total Users" value={usersQuery.data?.meta?.total || users.length} />
      </div>

      <section className="card">
        <h3>Create User</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="employee">employee</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
          <button type="submit" disabled={createUserState.isLoading}>
            {createUserState.isLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>User List</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.isActive ? 'Active' : 'Inactive'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
};

export default AdminUsersPage;
