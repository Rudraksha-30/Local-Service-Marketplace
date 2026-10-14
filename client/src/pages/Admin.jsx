import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { categoryLabel, fmtDate } from '../lib.js';
import { Empty, Notice, VerifiedMark } from '../components/bits.jsx';

function Stats() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/stats').then(setS).catch((e) => setError(e.message));
  }, []);
  if (error) return <Notice>{error}</Notice>;
  if (!s) return <p className="muted">Loading statistics…</p>;
  const cards = [
    ['Customers', s.users.customer || 0],
    ['Providers', s.providers.total],
    ['Bookings', s.bookings.total],
    ['Completed jobs', s.bookings.completed || 0],
    ['Reviews', s.reviews],
    ['Open disputes', s.disputes.open],
    ['Average Trust Score', s.providers.averageTrustScore ?? '–'],
  ];
  return (
    <div className="stats">
      {cards.map(([label, value]) => (
        <div className="stat" key={label}>
          <b>{value}</b>
          <span className="muted small">{label}</span>
        </div>
      ))}
    </div>
  );
}

function DisputeCard({ dispute, onChanged }) {
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resolve = async (e) => {
    e.preventDefault();
    if (!outcome) return setError('Choose an outcome first.');
    setBusy(true);
    setError('');
    try {
      await api.patch(`/admin/disputes/${dispute._id}/resolve`, { outcome, adminNote: note.trim() || undefined });
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const b = dispute.booking;
  return (
    <div className="panel">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>
          {b ? <Link to={`/bookings/${b._id}`}>{categoryLabel(b.category)} booking</Link> : 'Booking removed'}
        </h3>
        <span className={`status ${dispute.status === 'open' ? 'status-requested' : 'status-completed'}`}>{dispute.status === 'open' ? 'Open' : 'Resolved'}</span>
      </div>
      <p className="muted small" style={{ margin: '4px 0 10px' }}>
        Raised by {dispute.raisedBy?.name} ({dispute.raisedBy?.role}) against {dispute.against?.name} ({dispute.against?.role}) on {fmtDate(dispute.createdAt)}
      </p>
      <p>{dispute.reason}</p>
      {dispute.status === 'resolved' ? (
        <p className="small" style={{ margin: 0 }}>
          <strong>{{ provider_at_fault: 'Ruled against the provider', customer_at_fault: 'Ruled against the customer', no_fault: 'No fault found' }[dispute.outcome]}.</strong> {dispute.adminNote}
        </p>
      ) : (
        <form onSubmit={resolve}>
          <Notice>{error}</Notice>
          <div className="grid-2">
            <div className="field">
              <label htmlFor={`o-${dispute._id}`}>Outcome</label>
              <select id={`o-${dispute._id}`} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="">Choose…</option>
                <option value="provider_at_fault">Provider at fault (lowers their score)</option>
                <option value="customer_at_fault">Customer at fault</option>
                <option value="no_fault">No fault found</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`n-${dispute._id}`}>Note to both sides</label>
              <input id={`n-${dispute._id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </div>
          </div>
          <button className="btn btn-sm" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Resolve dispute'}</button>
        </form>
      )}
    </div>
  );
}

function Disputes() {
  const [status, setStatus] = useState('open');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setItems(null);
    api.get(`/admin/disputes?status=${status}`).then((d) => setItems(d.disputes)).catch((e) => setError(e.message));
  }, [status]);
  useEffect(load, [load]);

  return (
    <div>
      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={status === 'open'} onClick={() => setStatus('open')}>Open</button>
        <button className="tab" role="tab" aria-selected={status === 'resolved'} onClick={() => setStatus('resolved')}>Resolved</button>
      </div>
      <Notice>{error}</Notice>
      {!items && !error && <p className="muted">Loading disputes…</p>}
      {items && items.length === 0 && <Empty title={status === 'open' ? 'No open disputes' : 'No resolved disputes yet'} />}
      <div className="cards">
        {(items || []).map((d) => <DisputeCard key={d._id} dispute={d} onChanged={load} />)}
      </div>
    </div>
  );
}

function Providers() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(() => {
    api.get('/admin/providers').then((d) => setItems(d.providers)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const toggle = async (p) => {
    setBusyId(p._id);
    setError('');
    try {
      await api.patch(`/admin/providers/${p._id}/verify`, { isVerified: !p.isVerified });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Notice>{error}</Notice>
      {!items && !error && <p className="muted">Loading providers…</p>}
      {items && items.length === 0 && <Empty title="No providers yet" />}
      {items && items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Provider</th><th>Services</th><th>Area</th><th>Trust</th><th>Status</th><th><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/providers/${p._id}`}>{p.user?.name}</Link>
                    <div className="muted small">{p.user?.email}</div>
                  </td>
                  <td>{p.categories.map(categoryLabel).join(', ') || '–'}</td>
                  <td>{p.serviceArea || '–'}</td>
                  <td>{Math.round(p.trust.score)}{p.trust.isNewProvider ? ' (new)' : ''}</td>
                  <td>{p.isVerified ? <VerifiedMark /> : <span className="muted">Not verified</span>}</td>
                  <td>
                    <button className={`btn btn-sm ${p.isVerified ? 'btn-ghost' : ''}`} disabled={busyId === p._id} onClick={() => toggle(p)}>
                      {p.isVerified ? 'Remove badge' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  return (
    <main className="container page">
      <h1 style={{ fontSize: '2rem' }}>Admin</h1>
      <div className="tabs" role="tablist">
        {[['overview', 'Overview'], ['disputes', 'Disputes'], ['providers', 'Providers']].map(([key, label]) => (
          <button key={key} className="tab" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === 'overview' && <Stats />}
      {tab === 'disputes' && <Disputes />}
      {tab === 'providers' && <Providers />}
    </main>
  );
}
