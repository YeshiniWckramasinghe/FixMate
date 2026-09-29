import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  CUSTOMER: [
    { to: '/services', label: 'Browse Services' },
    { to: '/my-bookings', label: 'My Bookings' },
  ],
  PROVIDER: [
    { to: '/provider/services', label: 'My Services' },
    { to: '/provider/bookings', label: 'Bookings Received' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users & Providers' },
    { to: '/admin/bookings', label: 'All Bookings' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = NAV_BY_ROLE[user?.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        Fix<span>Mate</span>
      </div>
      <div className="sidebar-role">{user?.role?.toLowerCase()} account</div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          {user?.email}
        </div>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
