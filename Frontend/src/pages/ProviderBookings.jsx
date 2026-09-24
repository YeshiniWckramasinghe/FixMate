import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import StatusPill from '../components/StatusPill';

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/bookings/provider');
      setBookings(data.sort((a, b) => b.id - a.id));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await client.put(`/api/bookings/${id}/status`, { status });
      await load();
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
          <h1>Bookings Received</h1>
          <p>Accept, reject, or complete requests from customers.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="loading-text">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state">No bookings yet for your services.</div>
        ) : (
          bookings.map((b) => (
            <div className={`card booking-card status-${b.status}`} key={b.id}>
              <div className="card-row">
                <div>
                  <h3>{b.serviceName}</h3>
                  <p className="card-meta">Customer: {b.customerName}</p>
                  <p className="card-meta">
                    {b.bookingDate} at {b.bookingTime?.slice(0, 5)}
                  </p>
                  <p className="card-meta">{b.address}</p>
                  {b.notes && <p className="card-meta">Note: {b.notes}</p>}
                </div>
                <StatusPill status={b.status} />
              </div>
              <div className="card-actions">
                {b.status === 'PENDING' && (
                  <>
                    <button
                      className="btn btn-green btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => updateStatus(b.id, 'ACCEPTED')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => updateStatus(b.id, 'REJECTED')}
                    >
                      Reject
                    </button>
                  </>
                )}
                {b.status === 'ACCEPTED' && (
                  <>
                    <button
                      className="btn btn-green btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                    >
                      Mark completed
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => updateStatus(b.id, 'CANCELLED')}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
