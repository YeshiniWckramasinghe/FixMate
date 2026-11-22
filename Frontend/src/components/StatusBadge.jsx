// Coloured pill for a booking status (colours come from provider.css)
const STATUS = {
  PENDING: { label: 'Pending', tone: 'pending' },
  ACCEPTED: { label: 'Accepted', tone: 'accepted' },
  COMPLETED: { label: 'Completed', tone: 'completed' },
  REJECTED: { label: 'Declined', tone: 'cancelled' },
  CANCELLED: { label: 'Cancelled', tone: 'cancelled' },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: '' };
  return <span className={`fm-badge fm-badge-${s.tone}`}>{s.label}</span>;
}