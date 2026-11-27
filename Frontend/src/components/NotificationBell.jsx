import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

// Bell in the top bar. The backend has no notifications table, so this builds them
// from the bookings the person already has:
//   provider -> booking requests that are still waiting for an answer
//   customer -> bookings the provider has accepted, declined, completed or cancelled
//               (a red dot shows until the bell has been opened since the change)

const REFRESH_MS = 60000;
const MAX_SHOWN = 6;

const CUSTOMER_EVENTS = {
  ACCEPTED: 'Booking accepted',
  REJECTED: 'Booking declined',
  COMPLETED: 'Booking completed',
  CANCELLED: 'Booking cancelled',
};

function time12(value = '') {
  const [h, m] = value.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function when(b) {
  const day = new Date(`${b.bookingDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  return `${day} · ${time12(b.bookingTime)}`;
}

function readSeen(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;
  const userKey = user?.userId ?? user?.email;
  const seenKey = `fixmate_seen_${userKey}`;

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const bookingsRef = useRef([]); // the latest list, used when the bell is opened

  const load = useCallback(async () => {
    if (role !== 'PROVIDER' && role !== 'CUSTOMER') return;
    try {
      if (role === 'PROVIDER') {
        const { data } = await client.get('/api/bookings/provider');
        const pending = data.filter((b) => b.status === 'PENDING').sort((a, b) => b.id - a.id);
        setItems(
          pending.map((b) => ({
            id: b.id,
            title: 'New booking request',
            text: `${b.serviceName} from ${b.customerName}`,
            meta: when(b),
            to: '/provider/bookings',
            unread: true,
          })),
        );
        setUnread(pending.length);
        return;
      }

      const { data } = await client.get('/api/bookings/my');
      bookingsRef.current = data;
      let seen = readSeen(seenKey);
      if (!seen) {
        // first time on this browser: everything that already happened counts as seen
        seen = Object.fromEntries(data.map((b) => [b.id, b.status]));
        localStorage.setItem(seenKey, JSON.stringify(seen));
      }
      const events = data
        .filter((b) => CUSTOMER_EVENTS[b.status])
        .sort((a, b) => b.id - a.id)
        .map((b) => ({
          id: b.id,
          title: CUSTOMER_EVENTS[b.status],
          text: `${b.serviceName} with ${b.providerName}`,
          meta: when(b),
          to: '/my-bookings',
          unread: seen[b.id] !== b.status,
        }));
      setItems(events);
      setUnread(events.filter((e) => e.unread).length);
    } catch {
      // A failed refresh should never get in the way of the page, so stay quiet
    }
  }, [role, seenKey]);

  // refresh on first load, on every page change, and once a minute
  useEffect(() => {
    load();
  }, [load, location.pathname]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (role !== 'PROVIDER' && role !== 'CUSTOMER') return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && role === 'CUSTOMER') {
      // opening the bell marks everything as seen (the list keeps its highlight until it closes)
      localStorage.setItem(
        seenKey,
        JSON.stringify(Object.fromEntries(bookingsRef.current.map((b) => [b.id, b.status]))),
      );
      setUnread(0);
    }
  };

  const allLink = role === 'PROVIDER' ? '/provider/bookings' : '/my-bookings';

  return (
    <div className="fm-bell" ref={bellRef}>
      <button
        type="button"
        className="fm-notification"
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="bell" />
        {unread > 0 && <i />}
      </button>

      {open && (
        <div className="fm-notify-menu" role="menu">
          <div className="fm-notify-head">
            <b>Notifications</b>
            {items.some((i) => i.unread) && (
              <span>{items.filter((i) => i.unread).length} new</span>
            )}
          </div>
          {items.length === 0 ? (
            <p className="fm-notify-empty">You’re all caught up.</p>
          ) : (
            <div className="fm-notify-list">
              {items.slice(0, MAX_SHOWN).map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  role="menuitem"
                  className={`fm-notify-item ${item.unread ? 'fm-unread' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                  <small>{item.meta}</small>
                </Link>
              ))}
            </div>
          )}
          <Link to={allLink} className="fm-notify-foot" onClick={() => setOpen(false)}>
            {role === 'PROVIDER' ? 'View all bookings' : 'View my bookings'}
          </Link>
        </div>
      )}
    </div>
  );
}