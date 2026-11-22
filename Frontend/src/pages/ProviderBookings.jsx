import { useCallback, useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import ProviderLayout from '../components/ProviderLayout';
import StatusBadge from '../components/StatusBadge';
import '../provider.css';

// Tabs above the table. "match" decides which bookings each tab shows.
const TABS = [
  { label: 'All', match: () => true },
  { label: 'Pending', match: (b) => b.status === 'PENDING' },
  { label: 'Accepted', match: (b) => b.status === 'ACCEPTED' },
  { label: 'Completed', match: (b) => b.status === 'COMPLETED' },
  { label: 'Cancelled', match: (b) => b.status === 'CANCELLED' || b.status === 'REJECTED' },
];

// "14:30:00" -> "2:30 PM"
function time12(value = '') {
  const [h, m] = value.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// "2026-06-18" -> "18 Jun" (the year is added when it is not the current year)
function dayMonth(value) {
  const date = new Date(`${value}T00:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, s] = await Promise.all([
        client.get('/api/bookings/provider'),
        // only used to show the amount, so a failure here should not hide the bookings
        client.get('/api/provider/services').catch(() => ({ data: [] })),
      ]);
      setBookings([...b.data].sort((x, y) => y.id - x.id));
      setServices(s.data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  // Bookings do not carry a price, so look it up from the service
  const priceOf = useMemo(() => new Map(services.map((s) => [s.id, Number(s.price)])), [services]);

  const activeTab = TABS.find((t) => t.label === tab) || TABS[0];
  const shown = bookings.filter(activeTab.match);

  return (
    <ProviderLayout>
      <div className="fm-dash">
        <div className="fm-page-header">
          <div>
            <h1>Manage bookings</h1>
            <p>Review requests and keep customers updated.</p>
          </div>
        </div>

        {error && (
          <div className="fm-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={load}>
              Try again
            </button>
          </div>
        )}

        <div className="fm-toolbar">
          <div className="fm-tabs fm-compact-tabs" role="tablist" aria-label="Filter bookings">
            {TABS.map((t) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === t.label}
                className={tab === t.label ? 'fm-active' : ''}
                key={t.label}
                onClick={() => setTab(t.label)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fm-card fm-table-card">
          {!loading && shown.length === 0 ? (
            <p className="fm-table-empty">
              {bookings.length === 0
                ? 'No bookings yet for your services.'
                : `No ${tab.toLowerCase()} bookings.`}
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Date &amp; time</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [0, 1, 2, 3].map((i) => (
                      <tr className="fm-skeleton-row" key={i}>
                        <td colSpan={6}>
                          <div className="fm-skeleton-block" style={{ height: 28 }} />
                        </td>
                      </tr>
                    ))
                  : shown.map((b) => {
                      const busy = busyId === b.id;
                      const price = priceOf.get(b.serviceId);
                      return (
                        <tr key={b.id}>
                          <td>
                            <b>#FM-{String(b.id).padStart(4, '0')}</b>
                            <small>{b.serviceName}</small>
                          </td>
                          <td>
                            {b.customerName}
                            {b.address && <small>{b.address}</small>}
                            {b.notes && <small className="fm-note">Note: {b.notes}</small>}
                          </td>
                          <td>
                            {dayMonth(b.bookingDate)} · {time12(b.bookingTime)}
                          </td>
                          <td>
                            <b>{price != null ? `LKR ${price.toLocaleString()}` : '—'}</b>
                          </td>
                          <td>
                            <StatusBadge status={b.status} />
                          </td>
                          <td>
                            <div className="fm-table-buttons">
                              {b.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    className="fm-accept"
                                    disabled={busy}
                                    onClick={() => updateStatus(b.id, 'ACCEPTED')}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="fm-reject"
                                    disabled={busy}
                                    onClick={() => updateStatus(b.id, 'REJECTED')}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {b.status === 'ACCEPTED' && (
                                <>
                                  <button
                                    type="button"
                                    className="fm-accept"
                                    disabled={busy}
                                    onClick={() => updateStatus(b.id, 'COMPLETED')}
                                  >
                                    Complete
                                  </button>
                                  <button
                                    type="button"
                                    className="fm-reject"
                                    disabled={busy}
                                    onClick={() => updateStatus(b.id, 'CANCELLED')}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}