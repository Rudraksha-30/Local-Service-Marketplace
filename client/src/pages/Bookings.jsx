import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { categoryLabel, fmtDateTime } from '../lib.js';
import { Empty, Notice, StatusBadge } from '../components/bits.jsx';

const ACTIVE = ['requested', 'accepted', 'in_progress'];

export default function Bookings() {
  const { user } = useAuth();
  const isProvider = user.role === 'provider';
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState('active');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    api.get('/bookings').then((d) => setBookings(d.bookings)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const respond = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const active = (bookings || []).filter((b) => ACTIVE.includes(b.status)).sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart));
  const past = (bookings || []).filter((b) => !ACTIVE.includes(b.status));
  const shown = tab === 'active' ? active : past;
  const waiting = isProvider ? active.filter((b) => b.status === 'requested').length : 0;

  return (
    <main className="container page">
      <h1 style={{ fontSize: '2rem' }}>{isProvider ? 'Bookings' : 'My bookings'}</h1>
      {isProvider && waiting > 0 && <Notice kind="info">{waiting} {waiting === 1 ? 'request is' : 'requests are'} waiting for your reply. Quick replies raise your Trust Score.</Notice>}
      <Notice>{error}</Notice>

      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === 'active'} onClick={() => setTab('active')}>Upcoming and active ({active.length})</button>
        <button className="tab" role="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>Past ({past.length})</button>
      </div>

      {!bookings && !error && <p className="muted">Loading bookings…</p>}

      {bookings && shown.length === 0 && (
        <Empty title={tab === 'active' ? 'Nothing scheduled' : 'No past bookings'}>
          {isProvider ? 'New requests from customers will appear here.' : (
            <>Find a provider and request a time. <Link to="/providers">Browse providers</Link></>
          )}
        </Empty>
      )}

      <div className="cards">
        {shown.map((b) => {
          const other = isProvider ? b.customer : b.provider;
          return (
            <div className="brow" key={b._id}>
              <div>
                <h3>
                  <Link to={`/bookings/${b._id}`}>{categoryLabel(b.category)} with {other?.name}</Link>
                </h3>
                <p className="muted small" style={{ margin: 0 }}>{fmtDateTime(b.scheduledStart)} · {b.durationMinutes} min</p>
              </div>
              <div className="brow-actions">
                {b.disputeOpen && <span className="tag">Dispute open</span>}
                {!isProvider && b.status === 'completed' && !b.reviewed && <Link className="tag" to={`/bookings/${b._id}`}>Leave a review</Link>}
                <StatusBadge status={b.status} />
                {isProvider && b.status === 'requested' && (
                  <>
                    <button className="btn btn-sm" disabled={busyId === b._id} onClick={() => respond(b._id, 'accepted')}>Accept</button>
                    <button className="btn btn-ghost btn-sm" disabled={busyId === b._id} onClick={() => respond(b._id, 'rejected')}>Decline</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
