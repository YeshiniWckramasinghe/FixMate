import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import StatusPill from '../components/StatusPill';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/api/admin/bookings')
      .then(({ data }) => setBookings(data.sort((a, b) => b.id - a.id)))
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>All Bookings</h1>
          <p>Every booking across the platform.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="loading-text">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No bookings on the platform yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Customer</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.serviceName}</td>
                  <td>{b.customerName}</td>
                  <td>{b.providerName}</td>
                  <td>
                    {b.bookingDate} {b.bookingTime?.slice(0, 5)}
                  </td>
                  <td>
                    <StatusPill status={b.status} />
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
