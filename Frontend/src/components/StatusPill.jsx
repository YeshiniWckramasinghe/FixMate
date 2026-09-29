export default function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}
