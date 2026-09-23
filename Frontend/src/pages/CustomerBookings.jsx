import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(null); // booking being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/bookings/my');
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

  const cancelBooking = async (id) => {
    setBusyId(id);
    try {
      await client.delete(`/api/bookings/${id}`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setBusyId(reviewing.id);
    try {
      await client.post('/api/reviews', {
        bookingId: reviewing.id,
        rating: Number(rating),
        comment,
      });
      setReviewedIds(new Set([...reviewedIds, reviewing.id]));
      setReviewing(null);
      setRating(5);
      setComment('');
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
          <h1>My Bookings</h1>
          <p>Track the status of the services you've booked.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="loading-text">Loading bookings…</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            You haven't booked anything yet — head to Browse Services to get started.
          </div>
        ) : (
          bookings.map((b) => (
            <div className={`card booking-card status-${b.status}`} key={b.id}>
              <div className="card-row">
                <div>
                  <h3>{b.serviceName}</h3>
                  <p className="card-meta">Provider: {b.providerName}</p>
                  <p className="card-meta">
                    {b.bookingDate} at {b.bookingTime?.slice(0, 5)}
                  </p>
                  <p className="card-meta">{b.address}</p>
                </div>
                <StatusPill status={b.status} />
              </div>
              <div className="card-actions">
                {b.status === 'PENDING' && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyId === b.id}
                    onClick={() => cancelBooking(b.id)}
                  >
                    Cancel booking
                  </button>
                )}
                {b.status === 'COMPLETED' && !reviewedIds.has(b.id) && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setReviewing(b)}
                  >
                    Leave a review
                  </button>
                )}
                {b.status === 'COMPLETED' && reviewedIds.has(b.id) && (
                  <span className="card-meta">Review submitted — thank you!</span>
                )}
              </div>
            </div>
          ))
        )}

        {reviewing && (
          <Modal title={`Review: ${reviewing.serviceName}`} onClose={() => setReviewing(null)}>
            <form onSubmit={submitReview}>
              <div className="field">
                <label>Rating</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'star' : 'stars'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Comment</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the service?"
                />
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" disabled={busyId === reviewing.id}>
                  Submit review
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setReviewing(null)}>
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
