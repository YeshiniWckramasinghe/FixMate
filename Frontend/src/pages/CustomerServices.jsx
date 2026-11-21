import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import CustomerLayout from '../components/CustomerLayout';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { imageUrl } from '../utils/image';
import { formatPrice, formatTime, iconFor, initials } from '../utils/format';

const EMPTY_FORM = { bookingDate: '', bookingTime: '', address: '', notes: '' };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

const RATING_BUTTONS = [4.5, 4, 3];

// Pick an icon from the Figma set for a (free-text) category name
function categoryIcon(category = '') {
  const text = category.toLowerCase();
  if (/electric/.test(text)) return 'bolt';
  if (/plumb/.test(text)) return 'drop';
  if (/computer|laptop|\bpc\b/.test(text)) return 'monitor';
  if (/appliance/.test(text)) return 'tool';
  if (/\bac\b|a\/c|air\s?con|cooling|hvac/.test(text)) return 'wind';
  if (/clean/.test(text)) return 'sparkle';
  return 'tool';
}

const AVATAR_COLORS = ['blue', 'teal', 'violet', 'orange'];

// Round picture for a service: its thumbnail, or the provider's initials if there is none
function ServiceAvatar({ service }) {
  const [failed, setFailed] = useState(false);
  const color = AVATAR_COLORS[service.id % AVATAR_COLORS.length];
  const showImage = service.thumbnailUrl && !failed;
  return (
    <span className={`fm-avatar fm-avatar-xl fm-avatar-${color}`} aria-hidden="true">
      {showImage ? (
        <img
          src={imageUrl(service.thumbnailUrl)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(service.providerName)
      )}
      <i>
        <Icon name="check" size={11} />
      </i>
    </span>
  );
}

export default function CustomerServices() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState(urlQuery);
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(() => window.innerWidth > 820);

  const [booking, setBooking] = useState(null); // the service being booked
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState('');

  // Open times for the chosen date
  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [slotsVersion, setSlotsVersion] = useState(0); // bump to load the times again

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

  // The top-bar search sends people here as /services?q=...
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Category chips, with how many services each one has
  const categories = useMemo(() => {
    const counts = {};
    services.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  // Cheapest and dearest price, shown as hints in the price boxes
  const priceBounds = useMemo(() => {
    const prices = services.map((s) => Number(s.price));
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };
  }, [services]);

  // Score used by "Top rated". A plain average would put a single 5-star review above a service
  // with ten reviews averaging 4.8, so each average is pulled towards the overall average until
  // the service has a few reviews of its own. Services with no reviews go last.
  const ratingScore = useMemo(() => {
    const rated = services.filter((s) => s.reviewCount > 0);
    const overall = rated.length
      ? rated.reduce((sum, s) => sum + s.averageRating, 0) / rated.length
      : 0;
    const weight = 3;
    return (s) =>
      s.reviewCount > 0
        ? (s.reviewCount * s.averageRating + weight * overall) / (s.reviewCount + weight)
        : -1;
  }, [services]);

  // Filter by category, search text, price and rating, then sort. All in the browser.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    const matching = services.filter((s) => {
      if (category && s.category !== category) return false;
      if (min !== null && Number(s.price) < min) return false;
      if (max !== null && Number(s.price) > max) return false;
      if (minRating > 0 && !(s.reviewCount > 0 && s.averageRating >= minRating)) return false;
      if (!q) return true;
      return [s.name, s.description, s.category, s.providerName].some((value) =>
        (value || '').toLowerCase().includes(q)
      );
    });

    const byNewest = (a, b) => b.id - a.id; // newer services have bigger ids
    const sorted = [...matching];
    if (sort === 'rating') {
      sorted.sort(
        (a, b) => ratingScore(b) - ratingScore(a) || b.reviewCount - a.reviewCount || byNewest(a, b)
      );
    } else if (sort === 'price-asc') {
      sorted.sort((a, b) => Number(a.price) - Number(b.price) || byNewest(a, b));
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => Number(b.price) - Number(a.price) || byNewest(a, b));
    } else {
      sorted.sort(byNewest);
    }
    return sorted;
  }, [services, category, query, minPrice, maxPrice, minRating, sort, ratingScore]);

  const clearFilters = () => {
    setCategory('');
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setSort('newest');
  };

  // Ask the backend which times are open whenever the service or the date changes
  useEffect(() => {
    if (!booking || !form.bookingDate) {
      setSlots(null);
      setSlotsError('');
      return undefined;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    client
      .get(`/api/services/${booking.id}/slots`, { params: { date: form.bookingDate } })
      .then(({ data }) => {
        if (!cancelled) setSlots(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setSlots(null);
          setSlotsError(apiErrorMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [booking, form.bookingDate, slotsVersion]);

  const openBooking = (service) => {
    setBooking(service);
    setSubmitError('');
    setForm(EMPTY_FORM);
    setSlots(null);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!form.bookingTime) {
      setSubmitError('Please choose one of the available times.');
      return;
    }
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
      // Someone may have just taken that time, so show the up-to-date list
      setForm((current) => ({ ...current, bookingTime: '' }));
      setSlotsVersion((v) => v + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');

  return (
    <CustomerLayout>
      {toast && (
        <div className="toast" role="status">
          {toast} <Link to="/my-bookings">Track it in My bookings</Link>
        </div>
      )}

      <div className="fm-browse">
        <div className="fm-page-header">
          <div>
            <span>Find a professional</span>
            <h1>What can we help with?</h1>
            <p>Browse verified professionals available near you.</p>
          </div>
        </div>

        <form className="fm-search-panel" onSubmit={(e) => e.preventDefault()} role="search">
          <div className="fm-main-search">
            <Icon name="search" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search electrician, plumber, AC repair..."
              aria-label="Search services"
            />
          </div>
          <button
            type="button"
            className="fm-btn fm-btn-secondary"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((open) => !open)}
          >
            <Icon name="filter" size={16} /> Filters
          </button>
          <button type="submit" className="fm-btn fm-btn-primary">
            Search
          </button>
        </form>

        {categories.length > 0 && (
          <div className="fm-quick-categories" role="group" aria-label="Filter by category">
            {categories.map(([name, count]) => (
              <button
                type="button"
                key={name}
                title={`${count} ${count === 1 ? 'service' : 'services'}`}
                className={category === name ? 'fm-active' : ''}
                aria-pressed={category === name}
                onClick={() => setCategory(category === name ? '' : name)}
              >
                <span>
                  <Icon name={categoryIcon(name)} />
                </span>
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="fm-results-head">
          <div>
            <h2>
              {loading || error
                ? 'Professionals'
                : `${visible.length || 'No'} ${visible.length === 1 ? 'service' : 'services'} found`}
            </h2>
            <p>{category ? `Showing ${category}` : 'Showing all approved services'}</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort services"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`fm-browse-layout ${showFilters ? '' : 'fm-no-filters'}`}>
          <aside className="fm-filters" aria-label="Filters">
            <h3>
              Filters
              <button type="button" onClick={clearFilters}>
                Reset
              </button>
            </h3>

            <label>Price range (Rs.)</label>
            <div className="fm-price-inputs">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={String(priceBounds.min)}
                aria-label="Minimum price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={String(priceBounds.max)}
                aria-label="Maximum price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <label>Minimum rating</label>
            <div className="fm-rating-filter">
              {RATING_BUTTONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={minRating === r ? 'fm-active' : ''}
                  aria-pressed={minRating === r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                >
                  <span className="fm-stars">
                    <Icon name="star" size={13} /> <b>{r}</b>
                  </span>
                  &amp; up
                </button>
              ))}
            </div>
          </aside>

          <div className="fm-provider-list">
            {loading ? (
              <div aria-busy="true" aria-label="Loading services" className="fm-provider-list">
                {[0, 1, 2].map((i) => (
                  <div className="fm-skeleton" key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="fm-empty">
                <h3>We couldn’t load the services</h3>
                <p>{error}. Check that the FixMate backend is running, then try again.</p>
                <button type="button" className="fm-btn fm-btn-primary" onClick={loadServices}>
                  Try again
                </button>
              </div>
            ) : services.length === 0 ? (
              <div className="fm-empty">
                <h3>No services are listed yet</h3>
                <p>Services appear here once a provider has been approved and has added one.</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="fm-empty">
                <h3>Nothing matches your search</h3>
                <p>
                  Try a different word, widen the price range, or reset the filters to see every
                  service.
                </p>
                <button type="button" className="fm-btn fm-btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              visible.map((s) => (
                <article className="fm-provider-list-card" key={s.id}>
                  <ServiceAvatar service={s} />

                  <div className="fm-provider-info">
                    <div className="fm-provider-title">
                      <div>
                        <h3>{s.name}</h3>
                        <p>
                          {s.providerName} · {s.category}
                        </p>
                      </div>
                    </div>
                    <div className="fm-provider-meta">
                      {s.reviewCount > 0 ? (
                        <>
                          <span className="fm-stars">
                            <Icon name="star" size={15} /> <b>{s.averageRating.toFixed(1)}</b>
                          </span>
                          <span>
                            {s.reviewCount} {s.reviewCount === 1 ? 'review' : 'reviews'}
                          </span>
                        </>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                    </div>
                    <p className="fm-provider-blurb">
                      {s.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="fm-list-price">
                    <small>Starts from</small>
                    <b>LKR {Number(s.price).toLocaleString()}</b>
                    <small>per visit</small>
                    <button
                      type="button"
                      className="fm-btn fm-btn-primary"
                      onClick={() => openBooking(s)}
                    >
                      Book now
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {booking && (
        <Modal title={`Book ${booking.name}`} onClose={() => setBooking(null)}>
          <div className="book-summary">
            <div className="cat-icon" aria-hidden="true">
              {booking.thumbnailUrl ? (
                <img src={imageUrl(booking.thumbnailUrl)} alt="" />
              ) : (
                iconFor(booking.category)
              )}
            </div>
            <div>
              <strong>{booking.name}</strong>
              <span className="by">{booking.providerName}</span>
            </div>
            <div className="cat-price">{formatPrice(booking.price)}</div>
          </div>

          {submitError && <div className="alert alert-error">{submitError}</div>}

          <form onSubmit={submitBooking}>
            <div className="field">
              <label htmlFor="bk-date">Date</label>
              <input
                id="bk-date"
                type="date"
                required
                min={today}
                max={maxDate}
                value={form.bookingDate}
                onChange={(e) => setForm({ ...form, bookingDate: e.target.value, bookingTime: '' })}
              />
            </div>

            <div className="field">
              <label id="bk-time-label">Time</label>
              {!form.bookingDate ? (
                <p className="slot-hint">Pick a date to see the available times.</p>
              ) : slotsLoading ? (
                <p className="slot-hint">Checking availability…</p>
              ) : slotsError ? (
                <div className="alert alert-error">{slotsError}</div>
              ) : slots && !slots.scheduleSet ? (
                <p className="slot-hint">
                  This provider hasn’t published their working hours yet, so they can’t be booked
                  online.
                </p>
              ) : slots && slots.slots.length === 0 ? (
                <p className="slot-hint">There are no times available on this day. Please try another date.</p>
              ) : slots ? (
                <>
                  <div className="slot-grid" role="radiogroup" aria-labelledby="bk-time-label">
                    {slots.slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.time}
                        role="radio"
                        aria-checked={form.bookingTime === slot.time}
                        disabled={!slot.available}
                        className={`slot ${form.bookingTime === slot.time ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, bookingTime: slot.time })}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                  <p className="slot-hint">
                    Each booking takes {slots.slotMinutes} minutes.
                    {slots.slots.some((slot) => !slot.available) && ' Crossed-out times are already booked.'}
                  </p>
                </>
              ) : null}
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