import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import Icon from './Icon';
import '../shell.css';

// Sidebar + top bar (Figma design), shared by the customer and provider sides.
//
// workspace    - small label above the menu, e.g. "Customer" -> "CUSTOMER WORKSPACE"
// roleLabel    - text under the user's name in the top bar
// nav          - [{ to, label, icon }] menu items
// logoTo       - where the FixMate logo links to
// headerSearch - show the "Search anything..." box (it searches the services)
// legacyClass  - class for a wrapper around the page content, for old pages that still
//                depend on their old stylesheet
export default function AppShell({
  workspace,
  roleLabel,
  nav,
  logoTo,
  headerSearch = false,
  legacyClass = '',
  children,
}) {
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

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services');
  };

  const content = legacyClass ? <div className={legacyClass}>{children}</div> : children;

  return (
    <div className="fm fm-app-shell">
      <aside className={`fm-sidebar ${mobileOpen ? 'fm-sidebar-open' : ''}`}>
        <div className="fm-sidebar-logo">
          <Link to={logoTo} className="fm-logo">
            <span>
              <Icon name="tool" size={20} />
            </span>
            FixMate
          </Link>
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        <span className="fm-workspace-label">{workspace} workspace</span>
        <nav aria-label="Main">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navClass}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
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

          {headerSearch && (
            <form className="fm-header-search" onSubmit={submitSearch} role="search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
                aria-label="Search services"
              />
            </form>
          )}

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
                  <small>{roleLabel}</small>
                </div>
                <Icon name="chevron" size={14} />
              </button>

              {menuOpen && (
                <div className="fm-user-dropdown" role="menu">
                  <div className="fm-ud-head">
                    <b>{user?.name}</b>
                    <span>{user?.email}</span>
                  </div>
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button type="button" role="menuitem" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="fm-page-content">{content}</main>
      </div>
    </div>
  );
}