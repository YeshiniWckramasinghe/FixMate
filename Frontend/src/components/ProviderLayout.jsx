import AppShell from './AppShell';

const NAV = [
  { to: '/provider/overview', label: 'Overview', icon: 'grid' },
  { to: '/provider/services', label: 'My services', icon: 'briefcase' },
  { to: '/provider/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/provider/availability', label: 'Availability', icon: 'clock' },
];

// Provider side: Figma sidebar + top bar around the page.
export default function ProviderLayout({ children }) {
  return (
    <AppShell workspace="Provider" roleLabel="Provider" nav={NAV} logoTo="/provider/overview">
      {children}
    </AppShell>
  );
}