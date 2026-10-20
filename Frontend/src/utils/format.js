// Small display helpers shared by the customer pages.

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
}

export function formatPrice(price) {
  return `Rs. ${Number(price).toLocaleString()}`;
}

// "2026-09-20" -> "Sun, 20 Sep 2026"
export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// "14:30:00" -> "2:30 pm"
export function formatTime(time) {
  if (typeof time !== 'string') return time ? String(time) : '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// The backend stores a free-text category, so match on keywords.
const ICONS = [
  [/electric/, '⚡'],
  [/plumb/, '🚰'],
  [/\bac\b|air|cool/, '❄️'],
  [/computer|laptop|\bpc\b/, '💻'],
  [/clean/, '🧹'],
  [/appliance/, '🔧'],
  [/paint/, '🎨'],
  [/carpent|wood/, '🪚'],
  [/garden|lawn/, '🌿'],
  [/pest/, '🐜'],
];

export function iconFor(category = '') {
  const text = category.toLowerCase();
  const match = ICONS.find(([pattern]) => pattern.test(text));
  return match ? match[1] : '🛠️';
}
