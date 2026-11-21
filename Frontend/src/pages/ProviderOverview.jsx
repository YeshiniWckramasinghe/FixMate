import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import ProviderLayout from '../components/ProviderLayout';
import '../provider.css';

// Booking statuses the backend uses -> label + badge colour from the design
const STATUS = {
  PENDING: { label: 'Pending', tone: 'pending' },
  ACCEPTED: { label: 'Accepted', tone: 'accepted' },
  COMPLETED: { label: 'Completed', tone: 'completed' },
  REJECTED: { label: 'Declined', tone: 'cancelled' },
  CANCELLED: { label: 'Cancelled', tone: 'cancelled' },
};

const RANGE_OPTIONS = [3, 7, 12]; // months shown in the earnings chart

function Badge({ status }) {
  const s = STATUS[status] || { label: status, tone: '' };
  return <span className={`fm-badge fm-badge-${s.tone}`}>{s.label}</span>;
}

const money = (n) => `LKR ${Math.round(n).toLocaleString()}`;
const moneyShort = (n) =>
  n >= 1000 ? `LKR ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `LKR ${Math.round(n)}`;

// "14:30:00" -> "2:30 PM"
function time12(value = '') {
  const [h, m] = value.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// "2026-06-18" -> "18 Jun"
function dayMonth(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

const monthKey = (date) => date.slice(0, 7); // "2026-06"

// The last `count` months, oldest first, e.g. [{ key: '2026-05', label: 'May' }, ...]
function lastMonths(count) {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return months;
}

export default function ProviderOverview() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, s] = await Promise.all([
        client.get('/api/bookings/provider'),
        client.get('/api/provider/services'),
      ]);
      setBookings(b.data);
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

  const stats = useMemo(() => {
    // Bookings do not carry a price, so look it up from the service
    const priceOf = new Map(services.map((s) => [s.id, Number(s.price)]));
    const amount = (b) => priceOf.get(b.serviceId);

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const thisMonth = today.slice(0, 7);
    const prev = new Date();
    prev.setDate(1);
    prev.setMonth(prev.getMonth() - 1);
    const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const completed = bookings.filter((b) => b.status === 'COMPLETED');
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED');

    // earnings = price of every completed job, grouped by month
    const earningsByMonth = {};
    completed.forEach((b) => {
      const key = monthKey(b.bookingDate);
      earningsByMonth[key] = (earningsByMonth[key] || 0) + (amount(b) || 0);
    });

    const todays = bookings
      .filter(
        (b) => b.bookingDate === today && b.status !== 'REJECTED' && b.status !== 'CANCELLED',
      )
      .sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));

    const finished = completed.length + cancelled.length;
    const reviews = services.reduce((sum, s) => sum + (s.reviewCount || 0), 0);
    const ratingTotal = services.reduce((sum, s) => sum + (s.averageRating || 0) * (s.reviewCount || 0), 0);

    return {
      amount,
      todays,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      earningsByMonth,
      monthEarnings: earningsByMonth[thisMonth] || 0,
      lastMonthEarnings: earningsByMonth[lastMonth] || 0,
      completionRate: finished ? (completed.length / finished) * 100 : null,
      finished,
      rating: reviews ? ratingTotal / reviews : null,
      reviews,
      recent: [...bookings].sort((a, b) => b.id - a.id).slice(0, 5),
    };
  }, [bookings, services]);

  const months = useMemo(() => lastMonths(range), [range]);
  const monthValues = months.map((m) => stats.earningsByMonth[m.key] || 0);
  const maxValue = Math.max(...monthValues, 0);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const dateLabel = `${now.toLocaleDateString('en-GB', { weekday: 'long' })}, ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`.toUpperCase();

  // Caption under "This month's earnings"
  let earningsNote = 'From completed jobs';
  let earningsUp = false;
  if (stats.lastMonthEarnings > 0) {
    const change = ((stats.monthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100;
    earningsNote = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
    earningsUp = change >= 0;
  }

  const dash = loading ? '…' : '—';

  return (
    <ProviderLayout>
      <div className="fm-dash">
        <div className="fm-page-header">
          <div>
            <span>{dateLabel}</span>
            <h1>
              {greeting}, {firstName}
            </h1>
            <p>Here’s what’s happening with your business today.</p>
          </div>
          <Link to="/provider/availability" className="fm-btn fm-btn-secondary">
            <Icon name="calendar" size={16} /> Manage availability
          </Link>
        </div>

        {error && (
          <div className="fm-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={load}>
              Try again
            </button>
          </div>
        )}

        <div className="fm-metric-grid">
          <div className="fm-metric fm-card">
            <div className="fm-metric-icon fm-tone-blue">
              <Icon name="calendar" />
            </div>
            <div>
              <span>Today’s bookings</span>
              <h3>{loading ? '…' : stats.todays.length}</h3>
              <small>
                {loading
                  ? ' '
                  : stats.pending > 0
                    ? `${stats.pending} awaiting your response`
                    : 'Nothing awaiting a response'}
              </small>
            </div>
          </div>

          <div className="fm-metric fm-card">
            <div className="fm-metric-icon fm-tone-green">
              <Icon name="money" />
            </div>
            <div>
              <span>This month’s earnings</span>
              <h3>{loading ? '…' : money(stats.monthEarnings)}</h3>
              <small className={earningsUp ? 'fm-up' : ''}>{loading ? ' ' : earningsNote}</small>
            </div>
          </div>

          <div className="fm-metric fm-card">
            <div className="fm-metric-icon fm-tone-violet">
              <Icon name="check" />
            </div>
            <div>
              <span>Completion rate</span>
              <h3>{stats.completionRate === null ? dash : `${stats.completionRate.toFixed(1)}%`}</h3>
              <small>
                {loading
                  ? ' '
                  : stats.finished
                    ? `${stats.finished} finished ${stats.finished === 1 ? 'job' : 'jobs'}`
                    : 'No finished jobs yet'}
              </small>
            </div>
          </div>

          <div className="fm-metric fm-card">
            <div className="fm-metric-icon fm-tone-orange">
              <Icon name="star" />
            </div>
            <div>
              <span>Average rating</span>
              <h3>{stats.rating === null ? dash : stats.rating.toFixed(1)}</h3>
              <small>
                {loading
                  ? ' '
                  : stats.reviews
                    ? `${stats.reviews} customer ${stats.reviews === 1 ? 'review' : 'reviews'}`
                    : 'No reviews yet'}
              </small>
            </div>
          </div>
        </div>

        <div className="fm-dashboard-grid">
          <div className="fm-card fm-chart-card">
            <div className="fm-card-heading">
              <div>
                <h3>Earnings overview</h3>
                <p>Your earnings over the last {range} months</p>
              </div>
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value))}
                aria-label="Chart period"
              >
                {RANGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    Last {n} months
                  </option>
                ))}
              </select>
            </div>
            <div className="fm-bar-chart" role="img" aria-label="Earnings per month">
              {months.map((m, i) => (
                <div key={m.key}>
                  <i style={{ height: `${maxValue ? Math.max((monthValues[i] / maxValue) * 92, 1.5) : 1.5}%` }}>
                    <span>{moneyShort(monthValues[i])}</span>
                  </i>
                  <small>{m.label}</small>
                </div>
              ))}
            </div>
            {!loading && maxValue === 0 && (
              <p className="fm-schedule-empty">
                No completed jobs in this period yet. Earnings appear once you mark a booking as
                completed.
              </p>
            )}
          </div>

          <div className="fm-card fm-schedule-card">
            <div className="fm-card-heading">
              <div>
                <h3>Today’s schedule</h3>
                <p>
                  {loading
                    ? 'Loading…'
                    : `${stats.todays.length} ${stats.todays.length === 1 ? 'booking' : 'bookings'} scheduled`}
                </p>
              </div>
              <Link to="/provider/bookings">View all</Link>
            </div>
            {!loading && stats.todays.length === 0 && (
              <p className="fm-schedule-empty">No bookings scheduled for today.</p>
            )}
            {stats.todays.slice(0, 4).map((b, i) => (
              <div className="fm-schedule-item" key={b.id}>
                <span>{time12(b.bookingTime)}</span>
                <i className={`fm-line-${i % 3}`} />
                <div>
                  <b>{b.serviceName}</b>
                  <small>
                    {b.customerName}
                    {b.address ? ` · ${b.address}` : ''}
                  </small>
                </div>
                <Badge status={b.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="fm-card fm-table-card">
          <div className="fm-card-heading fm-table-heading">
            <div>
              <h3>Recent bookings</h3>
              <p>Latest customer requests</p>
            </div>
            <Link to="/provider/bookings">View all</Link>
          </div>
          {!loading && stats.recent.length === 0 ? (
            <p className="fm-table-empty">No bookings yet for your services.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Date &amp; time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <b>#FM-{String(b.id).padStart(4, '0')}</b>
                      <small>{b.serviceName}</small>
                    </td>
                    <td>{b.customerName}</td>
                    <td>
                      {dayMonth(b.bookingDate)} · {time12(b.bookingTime)}
                    </td>
                    <td>
                      <b>{stats.amount(b) != null ? money(stats.amount(b)) : '—'}</b>
                    </td>
                    <td>
                      <Badge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}