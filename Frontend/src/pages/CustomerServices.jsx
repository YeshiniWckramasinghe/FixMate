import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CustomerLayout from '../components/CustomerLayout';
import Modal from '../components/Modal';
import RatingStars from '../components/RatingStars';
import { formatPrice, iconFor, initials } from '../utils/format';

const EMPTY_FORM = { bookingDate: '', bookingTime: '', address: '', notes: '' };

export default function CustomerServices() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');

  const [booking, setBooking] = useState(null); // the service being booked
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState('');

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/services');
      setServices(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Category chips, with how many services each one has
  const categories = useMemo(() => {
    const counts = {};
    services.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  // Filter by chip + search text, all in the browser
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category && s.category !== category) return false;
      if (!q) return true;
      return [s.name, s.description, s.category, s.providerName].some((value) =>
        (value || '').toLowerCase().includes(q)
      );
    });
  }, [services, category, query]);

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setCategory('');
    setQuery('');
  };

  const openBooking = (service) => {
    setBooking(service);
    setSubmitError('');
    setForm(EMPTY_FORM);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    const serviceName = booking.name;
    try {
      await client.post('/api/bookings', {
        serviceId: booking.id,
        bookingDate: form.bookingDate,
        bookingTime: `${form.bookingTime}:00`,
        address: form.address,
        notes: form.notes,
      });
      setBooking(null);
      setToast(`Booked “${serviceName}”.`);
      setTimeout(() => setToast(''), 6000);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <CustomerLayout>
      {toast && (
        <div className="toast" role="status">
          {toast} <Link to="/my-bookings">Track it in My bookings</Link>
        </div>
      )}

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 className="rise" style={{ '--r': 0 }}>
              Hi {firstName}, what needs fixing today?
            </h1>
            <p className="lead rise" style={{ '--r': 1 }}>
              Book an approved technician, pick a time that suits you, and follow the job until
              it’s done.
            </p>
            <form
              className="hero-search rise"
              style={{ '--r': 2 }}
              onSubmit={(e) => {
                e.preventDefault();
                scrollToServices();
              }}
            >
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by service, provider or problem"
                aria-label="Search services"
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </form>
          </div>

          {/* One decorative moment: an example booking that moves through its stages once on load */}
          <div className="ticket rise" style={{ '--r': 3 }} aria-hidden="true">
            <div className="ticket-head">
              <div className="ticket-icon">⚡</div>
              <div>
                <strong>Home wiring repair</strong>
                <span>Tomorrow, 10:30 am</span>
              </div>
            </div>
            <div className="ticket-tear" />
            <ol className="ticket-steps">
              <li style={{ '--s': 0 }}>
                <span className="dot" />
                <span className="lbl">Requested</span>
              </li>
              <li style={{ '--s': 1 }}>
                <span className="dot" />
                <span className="lbl">Confirmed</span>
              </li>
              <li style={{ '--s': 2 }}>
                <span className="dot" />
                <span className="lbl">Completed</span>
              </li>
            </ol>
            <p className="ticket-note">Example of how a booking progresses</p>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="wrap">
          <div className="section-title">
            <h2>Available services</h2>
            {!loading && !error && (
              <span className="count">
                {visible.length} {visible.length === 1 ? 'service' : 'services'}
                {category ? ` in ${category}` : ''}
              </span>
            )}
          </div>

          {categories.length > 0 && (
            <div className="chips" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`chip ${category === '' ? 'active' : ''}`}
                onClick={() => setCategory('')}
              >
                All <span className="n">{services.length}</span>
              </button>
              {categories.map(([name, count]) => (
                <button
                  type="button"
                  key={name}
                  className={`chip ${category === name ? 'active' : ''}`}
                  onClick={() => setCategory(name)}
                >
                  <span aria-hidden="true">{iconFor(name)}</span> {name}{' '}
                  <span className="n">{count}</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="catalogue" aria-busy="true" aria-label="Loading services">
              {[0, 1, 2].map((i) => (
                <div className="skeleton-row" key={i}>
                  <div className="sk sk-icon" />
                  <div>
                    <div className="sk sk-line w40" />
                    <div className="sk sk-line w25" />
                    <div className="sk sk-line w70" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="site-empty">
              <h3>We couldn’t load the services</h3>
              <p>{error}. Check that the FixMate backend is running, then try again.</p>
              <button type="button" className="btn btn-primary" onClick={loadServices}>
                Try again
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="site-empty">
              <h3>No services are listed yet</h3>
              <p>Services appear here once a provider has been approved and has added one.</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="site-empty">
              <h3>Nothing matches your search</h3>
              <p>Try a different word, or clear the filters to see every service.</p>
              <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="catalogue" key={category || 'all'}>
              {visible.map((s, i) => (
                <article className="cat-row" key={s.id} style={{ '--i': i }}>
                  <div className="cat-icon" aria-hidden="true">
                    {iconFor(s.category)}
                  </div>
                  <div className="cat-body">
                    <h3>{s.name}</h3>
                    <div className="cat-meta">
                      <span className="tag">{s.category}</span>
                      <span className="by">
                        <span className="mini-avatar" aria-hidden="true">
                          {initials(s.providerName)}
                        </span>
                        {s.providerName}
                      </span>
                      <RatingStars average={s.averageRating} count={s.reviewCount} />
                    </div>
                    <p className="cat-desc">{s.description || 'No description provided.'}</p>
                  </div>
                  <div className="cat-side">
                    <div className="cat-price">{formatPrice(s.price)}</div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openBooking(s)}
                    >
                      Book now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="assurance">
        <div className="wrap assurance-grid">
          <div className="assurance-item">
            <h3>Approved providers</h3>
            <p>An admin reviews every provider before their services appear here.</p>
          </div>
          <div className="assurance-item">
            <h3>Follow your booking</h3>
            <p>See each job move from requested, to confirmed, to completed.</p>
          </div>
          <div className="assurance-item">
            <h3>Review when it’s done</h3>
            <p>Once a provider marks the job completed, you can rate how it went.</p>
          </div>
        </div>
      </section>

      {booking && (
        <Modal title={`Book ${booking.name}`} onClose={() => setBooking(null)}>
          <div className="book-summary">
            <div className="cat-icon" aria-hidden="true">
              {iconFor(booking.category)}
            </div>
            <div>
              <strong>{booking.name}</strong>
              <span className="by">{booking.providerName}</span>
            </div>
            <div className="cat-price">{formatPrice(booking.price)}</div>
          </div>

          {submitError && <div className="alert alert-error">{submitError}</div>}

          <form onSubmit={submitBooking}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="bk-date">Date</label>
                <input
                  id="bk-date"
                  type="date"
                  required
                  min={today}
                  value={form.bookingDate}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bk-time">Time</label>
                <input
                  id="bk-time"
                  type="time"
                  required
                  value={form.bookingTime}
                  onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="bk-address">Address</label>
              <input
                id="bk-address"
                required
                placeholder="Where should the technician come?"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="bk-notes">Notes (optional)</label>
              <textarea
                id="bk-notes"
                rows={3}
                placeholder="Anything the provider should know"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="card-actions">
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setBooking(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </CustomerLayout>
  );
}
