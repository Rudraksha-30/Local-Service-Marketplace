import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { timeAgo } from '../lib.js';
import { Notice } from './bits.jsx';

/**
 * Booking chat (FR-22). New messages arrive by polling every 5 seconds, which keeps the server simple
 * (no websockets to host) and is plenty for a conversation about a booking.
 */
export default function Chat({ bookingId, meId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const lastRef = useRef(null);

  const merge = (incoming) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m._id));
      const fresh = incoming.filter((m) => !seen.has(m._id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    lastRef.current = incoming[incoming.length - 1].createdAt;
  };

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    lastRef.current = null;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const qs = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : '';
        const d = await api.get(`/bookings/${bookingId}/messages${qs}`);
        if (!cancelled) merge(d.messages);
      } catch (e) {
        if (!cancelled && lastRef.current === null) setError(e.message);
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [bookingId]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    try {
      const d = await api.post(`/bookings/${bookingId}/messages`, { text: body });
      merge([d.message]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="chat">
        <div className="chat-log" ref={logRef} aria-live="polite" aria-label="Messages">
          {messages.length === 0 && <p className="muted small">No messages yet. Say hello and confirm the details of the visit.</p>}
          {messages.map((m) => (
            <div key={m._id} className={`bubble${m.sender?._id === meId ? ' mine' : ''}`}>
              {m.text}
              <small>{m.sender?._id === meId ? 'You' : m.sender?.name} · {timeAgo(m.createdAt)}</small>
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={send}>
          <input aria-label="Write a message" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Write a message" />
          <button className="btn" type="submit" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>
      <div style={{ marginTop: 10 }}><Notice>{error}</Notice></div>
    </div>
  );
}
