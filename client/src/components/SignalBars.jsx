import { SIGNALS } from '../lib.js';

/** The four signals behind a score, with their weights, so a customer can see why a provider scores what they do. */
export default function SignalBars({ breakdown, compact = false }) {
  if (!breakdown) {
    return <p className="muted small">No activity yet, so this provider sits at the neutral starting score of 50.</p>;
  }
  return (
    <ul className={`signals${compact ? ' compact' : ''}`}>
      {SIGNALS.map((s) => {
        const value = breakdown[s.key]?.value ?? 0;
        return (
          <li key={s.key}>
            <div className="signal-head">
              <span>{s.label}</span>
              <span className="signal-meta">
                <strong>{Math.round(value)}</strong>
                <span className="muted"> · counts {s.weight}%</span>
              </span>
            </div>
            <div className="bar" role="presentation">
              <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
            {!compact && <p className="signal-hint">{s.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}
