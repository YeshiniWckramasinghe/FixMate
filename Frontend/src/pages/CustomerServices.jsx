import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

export default function CustomerServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [booking, setBooking] = useState(null); // service currently being booked
  const [form, setForm] = useState({ bookingDate: '', bookingTime: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadServices = async (cat = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/services', {
        params: cat ? { category: cat } : {},
      });
      setServices(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const categories = Array.from(new Set(services.map((s) => s.category))).sort();

  const openBooking = (service) => {
    setBooking(service);
    setSubmitError('');
    setForm({ bookingDate: '', bookingTime: '', address: '', notes: '' });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await client.post('/api/bookings', {
        serviceId: booking.id,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime + ':00',
        address: form.address,
        notes: form.notes,
      });
      setBooking(null);
      setSuccessMsg(`Booked "${booking.name}" — check My Bookings for status.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      setSubmitError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>Browse Services</h1>
          <p>Find a trusted technician for your home.</p>
        </div>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {categories.length > 0 && (
          <div className="tabs">
            <button
              className={`tab ${category === '' ? 'active' : ''}`}
              onClick={() => {
                setCategory('');
                loadServices('');
              }}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`tab ${category === c ? 'active' : ''}`}
                onClick={() => {
                  setCategory(c);
                  loadServices(c);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="loading-text">Loading services…</p>
        ) : services.length === 0 ? (
          <div className="empty-state">
            No services listed yet. Once a provider is approved and adds a
            service, it will show up here.
          </div>
        ) : (
          services.map((s) => (
            <div className="card" key={s.id}>
              <div className="card-row">
                <div>
                  <h3>{s.name}</h3>
                  <p className="card-meta">{s.category} · by {s.providerName}</p>
                  <p className="card-meta">{s.description}</p>
                </div>
                <div className="card-price">Rs. {Number(s.price).toLocaleString()}</div>
              </div>
              <div className="card-actions">
                <button className="btn btn-primary btn-sm" onClick={() => openBooking(s)}>
                  Book this service
                </button>
              </div>
            </div>
          ))
        )}

        {booking && (
          <Modal title={`Book: ${booking.name}`} onClose={() => setBooking(null)}>
            {submitError && <div className="alert alert-error">{submitError}</div>}
            <form onSubmit={submitBooking}>
              <div className="grid-2">
                <div className="field">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={form.bookingDate}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Time</label>
                  <input
                    type="time"
                    required
                    value={form.bookingTime}
                    onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Address</label>
                <input
                  required
                  placeholder="Where should the technician come?"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea
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
      </main>
    </div>
  );
}
