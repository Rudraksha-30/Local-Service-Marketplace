import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { timeAgo } from '../lib.js';
import { Empty, Notice } from '../components/bits.jsx';

const tellNavbar = () => window.dispatchEvent(new Event('notifications-changed'));

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get('/notifications')
      .then((d) => {
        setItems(d.notifications);
        setUnread(d.unread);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const open = async (n) => {
    if (!n.read) {
      await api.patch(`/notifications/${n._id}/read`).catch(() => {});
      tellNavbar();
    }
    if (n.link) navigate(n.link);
    else load();
  };

  const readAll = async () => {
    await api.post('/notifications/read-all').catch((e) => setError(e.message));
    tellNavbar();
    load();
  };

  return (
    <main className="container page">
      <div className="row-between" style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Notifications</h1>
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={readAll}>Mark all as read</button>}
      </div>
      <Notice>{error}</Notice>
      {!items && !error && <p className="muted">Loading notifications…</p>}
      {items && items.length === 0 && <Empty title="You're all caught up">Booking updates, messages and reviews will show up here.</Empty>}
      <div className="cards">
        {(items || []).map((n) => (
          <button key={n._id} className={`notif${n.read ? '' : ' unread'}`} onClick={() => open(n)}>
            <span className="notif-dot" aria-hidden="true" />
            <span>
              <span style={{ display: 'block', fontWeight: n.read ? 400 : 600 }}>{n.message}</span>
              <span className="muted small">{timeAgo(n.createdAt)}{n.read ? '' : ' · unread'}</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
