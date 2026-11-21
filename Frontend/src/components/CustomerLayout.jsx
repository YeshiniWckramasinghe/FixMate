import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import Icon from './Icon';
import '../customer.css'; // still used by the booking pop-up and the My bookings page
import '../shell.css';

// Sidebar + top bar shell for the customer side (Figma design).
export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false); // sidebar on small screens
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const [search, setSearch] = useState('');
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

  const navClass = ({ isActive }) => (isActive ? 'fm-active' : '');

  const signOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  // "Search anything" in the top bar searches the services
  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  return (
    <div className="fm fm-app-shell">
      <aside className={`fm-sidebar ${mobileOpen ? 'fm-sidebar-open' : ''}`}>
        <div className="fm-sidebar-logo">
          <Link to="/services" className="fm-logo">
            <span>
              <Icon name="tool" size={20} />
            </span>
            FixMate
          </Link>
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        <span className="fm-workspace-label">Customer workspace</span>
        <nav aria-label="Main">
          <NavLink to="/services" className={navClass} onClick={() => setMobileOpen(false)}>
            <Icon name="search" />
            Browse services
          </NavLink>
          <NavLink to="/my-bookings" className={navClass} onClick={() => setMobileOpen(false)}>
            <Icon name="calendar" />
            My bookings
          </NavLink>
        </nav>

        <div className="fm-sidebar-help">
          <span>
            <Icon name="settings" />
          </span>
          <b>Need some help?</b>
          <p>Our support team is here for you.</p>
          {/* Change this address to your real support email */}
          <a href="mailto:support@fixmate.lk">Contact support</a>
        </div>

        <button type="button" className="fm-logout" onClick={signOut}>
          <Icon name="logout" /> Sign out
        </button>
      </aside>

      <div className="fm-app-main">
        <header className="fm-app-header">
          <button
            type="button"
            className="fm-menu-button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <form className="fm-header-search" onSubmit={submitSearch} role="search">
            <Icon name="search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anything..."
              aria-label="Search services"
            />
          </form>

          <div className="fm-header-right">
            <div className="fm-user-menu" ref={menuRef}>
              <button
                type="button"
                className="fm-user-chip"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="fm-avatar fm-avatar-sm fm-avatar-blue">{initials(user?.name)}</span>
                <div>
                  <b>{user?.name}</b>
                  <small>Customer</small>
                </div>
                <Icon name="chevron" size={14} />
              </button>

              {menuOpen && (
                <div className="fm-user-dropdown" role="menu">
                  <div className="fm-ud-head">
                    <b>{user?.name}</b>
                    <span>{user?.email}</span>
                  </div>
                  <Link to="/my-bookings" role="menuitem" onClick={() => setMenuOpen(false)}>
                    My bookings
                  </Link>
                  <button type="button" role="menuitem" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="fm-page-content">
          {/* "site" keeps the old colours/rules for the booking pop-up and My bookings page */}
          <div className="site fm-legacy">{children}</div>
        </main>
      </div>
    </div>
  );
}