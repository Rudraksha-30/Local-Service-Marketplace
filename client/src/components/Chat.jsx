import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { timeAgo } from "../lib.js";
import { Notice } from "./bits.jsx";
import { Pencil, Trash2 } from "lucide-react";

export default function Chat({ bookingId, meId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [actionId, setActionId] = useState(null);

  const logRef = useRef(null);
  const lastRef = useRef(null);

  const syncMessages = (incoming) => {
    setMessages(incoming);
  };

  const poll = async () => {
    const qs = lastRef.current
      ? `?after=${encodeURIComponent(lastRef.current)}`
      : "";

    const d = await api.get(`/bookings/${bookingId}/messages${qs}`);
    merge(d.messages);
  };

  useEffect(() => {
    let cancelled = false;
    let polling = false;

    setMessages([]);

    const poll = async () => {
      if (cancelled || document.hidden || polling) return;

      polling = true;

      try {
        const d = await api.get(`/bookings/${bookingId}/messages`);

        if (!cancelled) {
          syncMessages(d.messages);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        polling = false;
      }
    };

    poll();

    const intervalId = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
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
    setError("");

    try {
      const d = await api.post(`/bookings/${bookingId}/messages`, {
        text: body,
      });

      setMessages((prev) => [...prev, d.message]);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (messageId) => {
    const body = editText.trim();

    if (!body || body.length > 1000) {
      setError("Message must be between 1 and 1000 characters.");
      return;
    }

    setActionId(messageId);
    setError("");

    try {
      const d = await api.patch(
        `/bookings/${bookingId}/messages/${messageId}`,
        { text: body },
      );

      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? d.message : m)),
      );

      setEditingId(null);
      setEditText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) {
      return;
    }

    setActionId(messageId);
    setError("");

    try {
      await api.delete(`/bookings/${bookingId}/messages/${messageId}`);

      setMessages((prev) => prev.filter((m) => m._id !== messageId));

      if (editingId === messageId) {
        setEditingId(null);
        setEditText("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="chat">
        <div
          className="chat-log"
          ref={logRef}
          aria-live="polite"
          aria-label="Messages"
        >
          {messages.length === 0 && (
            <p className="muted small">
              No messages yet. Say hello and confirm the details of the visit.
            </p>
          )}

          {messages.map((m) => {
            const isMine = String(m.sender?._id) === String(meId);
            const isEditing = editingId === m._id;
            const isBusy = actionId === m._id;

            return (
              <div key={m._id} className={`bubble${isMine ? " mine" : ""}`}>
                {isEditing ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={1000}
                      autoFocus
                      aria-label="Edit message"
                    />

                    <div className="row" style={{ marginTop: 8 }}>
                      <button
                        className="btn btn-sm"
                        type="button"
                        disabled={isBusy || !editText.trim()}
                        onClick={() => saveEdit(m._id)}
                      >
                        {isBusy ? "Saving…" : "Save"}
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>{m.text}</>
                )}

                <small>
                  {isMine ? "You" : m.sender?.name} · {timeAgo(m.createdAt)}
                  {m.updatedAt && m.updatedAt !== m.createdAt
                    ? " · edited"
                    : ""}
                </small>

                {isMine && !isEditing && (
                  <div className="chat-message-actions">
                    <button
                      type="button"
                      className="chat-icon-btn"
                      title="Edit message"
                      aria-label="Edit message"
                      disabled={isBusy}
                      onClick={() => {
                        setEditingId(m._id);
                        setEditText(m.text);
                        setError("");
                      }}
                    >
                      <Pencil size={15} strokeWidth={1.8} />
                    </button>

                    <button
                      type="button"
                      className="chat-icon-btn chat-delete-btn"
                      title="Delete message"
                      aria-label="Delete message"
                      disabled={isBusy}
                      onClick={() => deleteMessage(m._id)}
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form className="chat-form" onSubmit={send}>
          <input
            aria-label="Write a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Write a message"
          />

          <button className="btn" type="submit" disabled={busy || !text.trim()}>
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 10 }}>
        <Notice>{error}</Notice>
      </div>
    </div>
  );
}
