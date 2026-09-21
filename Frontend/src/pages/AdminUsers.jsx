import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async (role = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/admin/users', {
        params: role ? { role } : {},
      });
      setUsers(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await client.put(`/api/admin/providers/${id}/approve`);
      await load(filter);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const toggleEnabled = async (u) => {
    setBusyId(u.id);
    try {
      await client.put(`/api/admin/users/${u.id}/${u.enabled ? 'disable' : 'enable'}`);
      await load(filter);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>Users &amp; Providers</h1>
          <p>Approve providers and manage accounts.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="tabs">
          {['', 'CUSTOMER', 'PROVIDER', 'ADMIN'].map((r) => (
            <button
              key={r || 'ALL'}
              className={`tab ${filter === r ? 'active' : ''}`}
              onClick={() => {
                setFilter(r);
                load(r);
              }}
            >
              {r || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading-text">Loading users…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.role === 'PROVIDER' && !u.approved && 'Pending approval'}
                    {u.role === 'PROVIDER' && u.approved && (u.enabled ? 'Active' : 'Disabled')}
                    {u.role !== 'PROVIDER' && (u.enabled ? 'Active' : 'Disabled')}
                  </td>
                  <td>
                    <div className="card-actions" style={{ margin: 0 }}>
                      {u.role === 'PROVIDER' && !u.approved && (
                        <button
                          className="btn btn-green btn-sm"
                          disabled={busyId === u.id}
                          onClick={() => approve(u.id)}
                        >
                          Approve
                        </button>
                      )}
                      {u.role !== 'ADMIN' && (
                        <button
                          className={`btn btn-sm ${u.enabled ? 'btn-danger' : 'btn-ghost'}`}
                          disabled={busyId === u.id}
                          onClick={() => toggleEnabled(u)}
                        >
                          {u.enabled ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
