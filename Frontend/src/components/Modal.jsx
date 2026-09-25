export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
