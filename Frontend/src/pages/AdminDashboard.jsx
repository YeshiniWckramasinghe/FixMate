import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';

const LABELS = {
  totalUsers: 'Total users',
  totalCustomers: 'Customers',
  totalProviders: 'Providers',
  pendingProviderApprovals: 'Pending approvals',
  totalServices: 'Services listed',
  totalBookings: 'Total bookings',
  pendingBookings: 'Pending bookings',
  completedBookings: 'Completed bookings',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/api/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch((e) => setError(apiErrorMessage(e)));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>A snapshot of what's happening on FixMate.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {stats ? (
          <div className="stat-grid">
            {Object.entries(LABELS).map(([key, label]) => (
              <div className="stat-card" key={key}>
                <div className="stat-value">{stats[key]}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          !error && <p className="loading-text">Loading dashboard…</p>
        )}
      </main>
    </div>
  );
}
