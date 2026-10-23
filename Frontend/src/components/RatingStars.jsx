// Read-only star rating: five stars partly filled to match the average, plus the number and review count.
export default function RatingStars({ average, count }) {
  if (!count) {
    return <span className="rating none">No reviews yet</span>;
  }

  const percent = Math.max(0, Math.min(100, (average / 5) * 100));
  const label = `Rated ${average.toFixed(1)} out of 5 from ${count} ${
    count === 1 ? 'review' : 'reviews'
  }`;

  return (
    <span className="rating" role="img" aria-label={label} title={label}>
      <span className="rating-stars" style={{ '--pct': `${percent}%` }} aria-hidden="true">
        ★★★★★
      </span>
      <strong>{average.toFixed(1)}</strong>
      <span className="rating-count">({count})</span>
    </span>
  );
}
