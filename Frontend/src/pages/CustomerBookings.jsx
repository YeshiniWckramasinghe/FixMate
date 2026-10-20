import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import CustomerLayout from '../components/CustomerLayout';
import Modal from '../components/Modal';
import { formatDate, formatTime } from '../utils/format';

const STATUS_LABEL = {
  PENDING: 'Pending',
  ACCEPTED: 'Confirmed',
  COMPLETED: 'Completed',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
};

const TABS = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'PENDING', label: 'Pending', match: (b) => b.status === 'PENDING' },
  { key: 'ACCEPTED', label: 'Confirmed', match: (b) => b.status === 'ACCEPTED' },
  { key: 'COMPLETED', label: 'Completed', match: (b) => b.status === 'COMPLETED' },
  {
    key: 'CLOSED',
    label: 'Closed',
    match: (b) => b.status === 'CANCELLED' || b.status === 'REJECTED',
  },
];

const STAGES = ['Requested', 'Confirmed', 'Completed'];

// Shows where a booking is on its way from request to completion
function Track({ status }) {
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return (
      <p className="track-closed">
        {status === 'REJECTED'
          ? 'The provider declined this request.'
          : 'This booking was cancelled.'}
      </p>
    );
  }

  const reached = { PENDING: 0, ACCEPTED: 1, COMPLETED: 2 }[status] ?? 0;
  const completed = status === 'COMPLETED';

  return (
    <div className="track" aria-label={`Progress: ${STAGES[reached]}`}>
      {STAGES.map((label, i) => (
        <Fragment key={label}>
          <div
            className={`track-step ${i < reached || completed ? 'done' : ''} ${
              i === reached && !completed ? 'current' : ''
            }`}
          >
            <span className="track-dot" />
            {label}
          </div>
          {i < STAGES.length - 1 && <div className={`track-line ${i < reached ? 'done' : ''}`} />}
        </Fragment>
      ))}
    </div>
  );
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const [reviewing, setReviewing] = useState(null); // booking being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  // Reviews made in this session. The list endpoint doesn't say which bookings are reviewed yet.
  const [reviewedIds, setReviewedIds] = useState(new Set());

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/bookings/my');
      setBookings([...data].sort((a, b) => b.id - a.id));
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
    setError('');
    try {
      await client.delete(`/api/bookings/${id}`);
      await load(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const openReview = (booking) => {
    setReviewing(booking);
    setRating(5);
    setComment('');
    setReviewError('');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setBusyId(reviewing.id);
    setReviewError('');
    try {
      await client.post('/api/reviews', { bookingId: reviewing.id, rating, comment });
      setReviewedIds(new Set([...reviewedIds, reviewing.id]));
      setReviewing(null);
    } catch (err) {
      const message = apiErrorMessage(err);
      if (/already been reviewed/i.test(message)) {
        setReviewedIds(new Set([...reviewedIds, reviewing.id]));
        setReviewing(null);
      } else {
        setReviewError(message);
      }
    } finally {
      setBusyId(null);
    }
  };

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];
  const visible = bookings.filter(activeTab.match);

  return (
    <CustomerLayout>
      <section className="banner">
        <div className="banner-inner">
          <h1>My bookings</h1>
          <p>Follow each job from request to completion.</p>
        </div>
      </section>

      <section className="bookings">
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && bookings.length > 0 && (
          <div className="chips" role="group" aria-label="Filter by status">
            {TABS.map((t) => (
              <button
                type="button"
                key={t.key}
                className={`chip ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} <span className="n">{bookings.filter(t.match).length}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="b-card" aria-busy="true" aria-label="Loading bookings">
            <div className="sk sk-line w40" />
            <div className="sk sk-line w25" />
            <div className="sk sk-line w70" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="site-empty">
            <h3>No bookings yet</h3>
            <p>When you book a service, you can follow it here from request to completion.</p>
            <Link to="/services" className="btn btn-primary">
              Find a technician
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="site-empty">
            <h3>Nothing here</h3>
            <p>You have no {activeTab.label.toLowerCase()} bookings right now.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setTab('ALL')}>
              Show all bookings
            </button>
          </div>
        ) : (
          <div key={tab}>
            {visible.map((b, i) => (
              <article className="b-card" key={b.id} style={{ '--i': i }}>
                <div className="b-head">
                  <div>
                    <h3>{b.serviceName}</h3>
                    <div className="b-sub">with {b.providerName}</div>
                  </div>
                  <span className={`pill ${b.status.toLowerCase()}`}>
                    {STATUS_LABEL[b.status] || b.status}
                  </span>
                </div>

                <dl className="b-facts">
                  <div>
                    <dt>Date</dt>
                    <dd>{formatDate(b.bookingDate)}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{formatTime(b.bookingTime)}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{b.address || 'Not provided'}</dd>
                  </div>
                </dl>

                <Track status={b.status} />

                {(b.status === 'PENDING' || b.status === 'COMPLETED') && (
                  <div className="b-actions">
                    {b.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busyId === b.id}
                        onClick={() => cancelBooking(b.id)}
                      >
                        Cancel booking
                      </button>
                    )}
                    {b.status === 'COMPLETED' &&
                      (reviewedIds.has(b.id) ? (
                        <span className="b-sub">Thanks, your review was sent.</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openReview(b)}
                        >
                          Leave a review
                        </button>
                      ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {reviewing && (
        <Modal title={`Review ${reviewing.serviceName}`} onClose={() => setReviewing(null)}>
          {reviewError && <div className="alert alert-error">{reviewError}</div>}
          <form onSubmit={submitReview}>
            <div className="field">
              <label id="rating-label">Your rating</label>
              <div className="stars" role="radiogroup" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                    className={`star ${n <= rating ? 'on' : ''}`}
                    onClick={() => setRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="rv-comment">Comment (optional)</label>
              <textarea
                id="rv-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did the job go?"
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
    </CustomerLayout>
  );
}
