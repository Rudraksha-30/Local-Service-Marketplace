import { fmtDateTime } from '../lib.js';

const FLOW = [
  { status: 'requested', label: 'Requested' },
  { status: 'accepted', label: 'Accepted by the provider' },
  { status: 'in_progress', label: 'Job started' },
  { status: 'completed', label: 'Completed' },
];

const Tick = () => (
  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
    <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Booking status timeline. A booking is a real sequence of states, so an ordered list is the right shape. */
export default function Timeline({ booking }) {
  const at = {};
  (booking.statusHistory || []).forEach((h) => {
    at[h.status] = h.at;
  });
  const stopped = booking.status === 'rejected' || booking.status === 'cancelled';

  return (
    <ol className="timeline" aria-label="Booking progress">
      {FLOW.map((step) => {
        const reached = Boolean(at[step.status]);
        const isCurrent = step.status === booking.status && booking.status !== 'completed';
        const cls = isCurrent ? 'current' : reached ? 'done' : '';
        return (
          <li key={step.status} className={cls} aria-current={isCurrent ? 'step' : undefined}>
            <span className="dot">{cls === 'done' && <Tick />}</span>
            <strong>{step.label}</strong>
            {reached && <span className="muted small">{fmtDateTime(at[step.status])}</span>}
          </li>
        );
      })}
      {stopped && (
        <li className="stopped">
          <span className="dot" />
          <strong>{booking.status === 'rejected' ? 'Declined by the provider' : `Cancelled by the ${booking.cancelledByRole || 'user'}`}</strong>
          {at[booking.status] && <span className="muted small">{fmtDateTime(at[booking.status])}</span>}
          {booking.cancelReason && <span className="small" style={{ display: 'block' }}>Reason: {booking.cancelReason}</span>}
        </li>
      )}
    </ol>
  );
}
