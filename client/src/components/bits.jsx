import { STATUS_LABEL } from '../lib.js';

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function VerifiedMark() {
  return (
    <span className="verified" title="An admin has checked this provider's details">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M8 1l2 1.5 2.5-.2.9 2.4 2.1 1.4-.9 2.4.9 2.4-2.1 1.4-.9 2.4-2.5-.2L8 15l-2-1.5-2.5.2-.9-2.4L.5 9.9l.9-2.4L.5 5.1l2.1-1.4.9-2.4 2.5.2z" fill="currentColor" />
        <path d="M5.2 8.2l2 2 3.6-3.8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

/** Inline message. role=alert makes screen readers announce errors as they appear. */
export function Notice({ kind = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
