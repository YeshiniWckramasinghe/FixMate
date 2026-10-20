import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import '../customer.css';

// Top-navigation shell for the customer side of the site:
// sticky navbar + page content + footer.
export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const [navOpen, setNavOpen] = useState(false); // mobile menu
  const menuRef = useRef(null);

  // Close the dropdown when the user clicks anywhere else
  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');
  const firstName = user?.name?.split(' ')[0] || 'Account';

  return (
    <div className="site">
      <header className={`topnav ${navOpen ? 'open' : ''}`}>
        <div className="topnav-inner">
          <Link to="/services" className="topnav-brand">
            Fix<span>Mate</span>
          </Link>

          <nav className="topnav-links" aria-label="Main">
            <NavLink to="/services" className={linkClass} onClick={() => setNavOpen(false)}>
              Browse services
            </NavLink>
            <NavLink to="/my-bookings" className={linkClass} onClick={() => setNavOpen(false)}>
              My bookings
            </NavLink>
          </nav>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-chip"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="avatar">{initials(user?.name)}</span>
              <span className="user-name">{firstName}</span>
              <span className="caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="ud-head">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <Link to="/my-bookings" role="menuitem" onClick={() => setMenuOpen(false)}>
                  My bookings
                </Link>
                <button type="button" role="menuitem" onClick={logout}>
                  Log out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-brand">
            Fix<span>Mate</span>
          </span>
          <span>Home services, booked and tracked in one place.</span>
        </div>
      </footer>
    </div>
  );
}
