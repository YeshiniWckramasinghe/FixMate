import AppShell from './AppShell';
import '../customer.css'; // still used by the booking pop-up and the My bookings page

const NAV = [
  { to: '/services', label: 'Browse services', icon: 'search' },
  { to: '/my-bookings', label: 'My bookings', icon: 'calendar' },
];

// Customer side: Figma sidebar + top bar around the page.
export default function CustomerLayout({ children }) {
  return (
    <AppShell
      workspace="Customer"
      roleLabel="Customer"
      nav={NAV}
      logoTo="/services"
      headerSearch
      // "site" keeps the old colours/rules for the booking pop-up and My bookings page
      legacyClass="site fm-legacy"
    >
      {children}
    </AppShell>
  );
}