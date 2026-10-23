import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getAttachmentUrl } from "../api.js";
import { useAuth } from "../auth.jsx";
import { categoryLabel, fmtDate, fmtDateTime } from "../lib.js";
import Chat from "../components/Chat.jsx";
import Timeline from "../components/Timeline.jsx";
import { Notice, StatusBadge } from "../components/bits.jsx";
import { Pencil } from "lucide-react";

const DISPUTABLE = ["accepted", "in_progress", "completed", "cancelled"];
const OUTCOME_LABEL = {
  provider_at_fault: "Ruled in favour of the customer",
  customer_at_fault: "Ruled in favour of the provider",
  no_fault: "No fault found",
};

function ReviewForm({
  bookingId,
  onDone,
  existingReview = null,
  onCancel,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isEditing = Boolean(existingReview);

  const submit = async (e) => {
    e.preventDefault();

    if (!rating) {
      return setError("Choose a rating from 1 to 5 stars.");
    }

    setBusy(true);
    setError("");

    try {
      if (isEditing) {
        await api.patch(`/bookings/${bookingId}/review`, {
          rating,
          comment: comment.trim(),
        });
      } else {
        await api.post("/reviews", {
          bookingId,
          rating,
          comment: comment.trim() || undefined,
        });
      }

      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Notice>{error}</Notice>

      <fieldset
        style={{
          border: 0,
          padding: 0,
          margin: "0 0 12px",
        }}
      >
        <legend
          style={{
            fontWeight: 600,
            fontSize: ".9rem",
            marginBottom: 6,
            padding: 0,
          }}
        >
          How did it go?
        </legend>

        <div className="row" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              className={`btn btn-sm ${
                rating === n ? "" : "btn-ghost"
              }`}
              onClick={() => setRating(n)}
            >
              {n} ★
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="r-comment">Comment (optional)</label>
        <textarea
          id="r-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Was the provider on time and tidy?"
        />
      </div>

      <div className="row">
        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy
            ? isEditing
              ? "Saving…"
              : "Posting…"
            : isEditing
              ? "Save changes"
              : "Post review"}
        </button>

        {isEditing && onCancel && (
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function DisputeForm({ bookingId, onDone }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open)
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Report a problem
      </button>
    );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/disputes", { bookingId, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Notice>{error}</Notice>
      <div className="field">
        <label htmlFor="d-reason">What went wrong?</label>
        <textarea
          id="d-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={10}
          maxLength={500}
          required
          placeholder="Describe the problem so an admin can review it."
        />
        <p className="field-hint">
          An admin reads this and decides. Ten characters minimum.
        </p>
      </div>
      <div className="row">
        <button
          className="btn btn-danger btn-sm"
          type="submit"
          disabled={busy || reason.trim().length < 10}
        >
          {busy ? "Sending…" : "Send to admin"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  const isAdmin = user.role === "admin";

  const load = useCallback(async () => {
    try {
      const b = (await api.get(`/bookings/${id}`)).booking;
      setBooking(b);
      const loadedAttachments = await Promise.all(
        (b.attachments || []).map(async (file) => {
          try {
            const url = await getAttachmentUrl(
              `/bookings/${id}/attachments/${encodeURIComponent(file.filename)}`,
            );

            return { ...file, url };
          } catch {
            return { ...file, url: null };
          }
        }),
      );

      setAttachmentUrls(loadedAttachments);
      const [d, r] = await Promise.all([
        api
          .get(`/bookings/${id}/disputes`)
          .then((x) => x.disputes)
          .catch(() => []),
        isAdmin
          ? null
          : api
              .get(`/bookings/${id}/review`)
              .then((x) => x.review)
              .catch(() => null),
      ]);
      setDisputes(d);
      setReview(r);
    } catch (e) {
      setError(e.message);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <main className="container page">
        <Notice>{error}</Notice>
        <Link to="/bookings">Back to bookings</Link>
      </main>
    );
  }
  if (!booking)
    return (
      <main className="container page">
        <p className="muted">Loading booking…</p>
      </main>
    );

  const isCustomer = booking.customer?._id === user._id;
  const isProvider = booking.provider?._id === user._id;
  const other = isProvider ? booking.customer : booking.provider;

  const change = async (status, why) => {
    setBusy(true);
    setActionError("");
    try {
      await api.patch(`/bookings/${id}/status`, {
        status,
        reason: why || undefined,
      });
      setCancelling(false);
      setReason("");
      await load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAttachment = async (file) => {
    const confirmed = window.confirm(
      `Delete "${file.originalName}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingAttachment(file.filename);
    setActionError("");

    try {
      await api.delete(
        `/bookings/${id}/attachments/${encodeURIComponent(file.filename)}`,
      );

      if (file.url) {
        URL.revokeObjectURL(file.url);
      }

      setAttachmentUrls((current) =>
        current.filter((item) => item.filename !== file.filename),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingAttachment(null);
    }
  };

  const s = booking.status;
  const canCancel =
    (isCustomer && (s === "requested" || s === "accepted")) ||
    (isProvider && s === "accepted");
  const canDispute =
    (isCustomer || isProvider) &&
    DISPUTABLE.includes(s) &&
    !booking.disputeOpen;

  return (
    <main className="container page">
      <p className="small">
        <Link to={isAdmin ? "/admin" : "/bookings"}>
          {isAdmin ? "Admin" : "All bookings"}
        </Link>
      </p>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>
          {categoryLabel(booking.category)}
        </h1>
        <StatusBadge status={s} />
      </div>

      <div className="booking-grid">
        <section className="panel">
          <h2>Details</h2>
          <dl className="facts">
            <dt>
              {isAdmin ? "Customer" : isProvider ? "Customer" : "Provider"}
            </dt>
            <dd>
              {isAdmin ? booking.customer?.name : other?.name}
              {!isProvider && !isAdmin && (
                <>
                  {" "}
                  · <Link to="/providers">Browse other providers</Link>
                </>
              )}
            </dd>
            {isAdmin && (
              <>
                <dt>Provider</dt>
                <dd>{booking.provider?.name}</dd>
              </>
            )}
            {isProvider && booking.customer?.phone && (
              <>
                <dt>Phone</dt>
                <dd>{booking.customer.phone}</dd>
              </>
            )}
            <dt>When</dt>
            <dd>{fmtDateTime(booking.scheduledStart)}</dd>
            <dt>Length</dt>
            <dd>{booking.durationMinutes} minutes</dd>
            <dt>Address</dt>
            <dd>{booking.address || "Not given"}</dd>
            <dt>Notes</dt>
            <dd>{booking.notes || "None"}</dd>
            <dt>Attachments</dt>
            <dd>
              {attachmentUrls.length === 0 ? (
                "No attachments"
              ) : (
                <div className="attachment-list">
                  {attachmentUrls.map((file) => (
                    <div key={file.filename} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <p style={{ margin: 0 }}>{file.originalName}</p>

                        {isCustomer && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={deletingAttachment !== null}
                            onClick={() => deleteAttachment(file)}
                          >
                            {deletingAttachment === file.filename
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        )}
                      </div>

                      {file.url ? (
                        file.mimeType.startsWith("image/") ? (
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <img
                              src={file.url}
                              alt={file.originalName}
                              style={{
                                display: "block",
                                maxWidth: "100%",
                                maxHeight: 240,
                                borderRadius: 8,
                              }}
                            />
                          </a>
                        ) : file.mimeType.startsWith("video/") ? (
                          <video
                            src={file.url}
                            controls
                            style={{
                              display: "block",
                              maxWidth: "100%",
                              maxHeight: 300,
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          "Unsupported attachment type"
                        )
                      ) : (
                        "Unable to load this attachment"
                      )}
                    </div>
                  ))}
                </div>
              )}
            </dd>
          </dl>
        </section>

        <section className="panel">
          <h2>Progress</h2>
          <Timeline booking={booking} />
        </section>

        {(isCustomer || isProvider) && (
          <section className="panel span-2">
            <h2>Next step</h2>
            <Notice>{actionError}</Notice>
            <div className="next-step-content">
              {isProvider && s === "requested" && (
                <div className="row">
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => change("accepted")}
                  >
                    Accept booking
                  </button>
                  <button
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() => change("rejected")}
                  >
                    Decline
                  </button>
                </div>
              )}

              {isProvider && s === "accepted" && (
                <div className="next-step-actions">
                  <p className="muted small">
                    You have accepted this booking. Start the job when you are
                    ready.
                  </p>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => change("in_progress")}
                  >
                    Start the job
                  </button>
                </div>
              )}

              {isCustomer && s === "in_progress" && (
                <div className="next-step-actions">
                  <p className="muted small">
                    The job is underway. You can review it once it is completed.
                  </p>
                  <button
                    className="btn btn-accent"
                    disabled={busy}
                    onClick={() => change("completed")}
                  >
                    Mark as completed
                  </button>
                </div>
              )}

              {canCancel && !cancelling && (
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => setCancelling(true)}
                >
                  {s === "requested" ? "Cancel request" : "Cancel booking"}
                </button>
              )}

              {isCustomer && s === "requested" && (
                <p className="muted small">
                  Waiting for the provider to accept or decline.
                </p>
              )}

              {isCustomer && s === "accepted" && (
                <p className="muted small">
                  The provider will start the job at the scheduled time.
                </p>
              )}

              {isProvider && s === "in_progress" && (
                <p className="muted small">
                  You have started the job. Please complete the work and wait
                  for the customer to confirm completion.
                </p>
              )}

              {["rejected", "cancelled"].includes(s) && (
                <p className="muted small">This booking is closed.</p>
              )}

              {s === "completed" && !isCustomer && (
                <p className="muted small">
                  Completed. The customer can now leave a review.
                </p>
              )}
            </div>
            {cancelling && (
              <div style={{ marginTop: 14, maxWidth: 520 }}>
                <div className="field">
                  <label htmlFor="c-reason">
                    Why are you cancelling? (optional)
                  </label>
                  <textarea
                    id="c-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={300}
                  />
                </div>
                <div className="row">
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busy}
                    onClick={() => change("cancelled", reason.trim())}
                  >
                    Confirm cancellation
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCancelling(false)}
                  >
                    Keep booking
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {isCustomer && s === "completed" && (
          <section className="panel span-2">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2>Your review</h2>

              {review && !editingReview && (
                <button
                  type="button"
                  className="chat-icon-btn"
                  title="Edit review"
                  aria-label="Edit review"
                  onClick={() => setEditingReview(true)}
                >
                  <Pencil size={16} strokeWidth={1.8} />
                </button>
              )}
            </div>

            {editingReview ? (
              <ReviewForm
                bookingId={id}
                existingReview={review}
                onDone={() => {
                  setEditingReview(false);
                  load();
                }}
                onCancel={() => setEditingReview(false)}
              />
            ) : booking.reviewed || review ? (
              review ? (
                <>
                  <div
                    className="stars"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                  </div>

                  <p style={{ margin: "4px 0 0" }}>
                    {review.comment || "No comment."}
                  </p>

                  <p className="muted small" style={{ margin: "4px 0 0" }}>
                    Posted {fmtDate(review.updatedAt || review.createdAt)}
                  </p>
                </>
              ) : (
                <p className="muted">You have already reviewed this booking.</p>
              )
            ) : (
              <ReviewForm bookingId={id} onDone={load} />
            )}
          </section>
        )}

        {isProvider && s === "completed" && review && (
          <section className="panel span-2">
            <h2>Customer review</h2>
            <div
              className="stars"
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
            </div>
            <p style={{ margin: "4px 0 0" }}>
              {review.comment || "No comment."}
            </p>
          </section>
        )}

        {(disputes.length > 0 || canDispute) && (
          <section className="panel span-2">
            <h2>Problems reported</h2>
            {disputes.map((d) => (
              <div key={d._id} className="review">
                <div className="row-between">
                  <strong>{d.raisedBy?.name} reported a problem</strong>
                  <span
                    className={`status ${d.status === "open" ? "status-requested" : "status-completed"}`}
                  >
                    {d.status === "open" ? "Open" : "Resolved"}
                  </span>
                </div>
                <p style={{ margin: "4px 0" }}>{d.reason}</p>
                {d.status === "resolved" && (
                  <p className="small" style={{ margin: 0 }}>
                    <strong>{OUTCOME_LABEL[d.outcome]}.</strong> {d.adminNote}
                  </p>
                )}
              </div>
            ))}
            {canDispute && (
              <div style={{ marginTop: disputes.length ? 14 : 0 }}>
                <DisputeForm bookingId={id} onDone={load} />
              </div>
            )}
          </section>
        )}

        {(isCustomer || isProvider) && (
          <section className="panel span-2">
            <h2>Chat with {other?.name}</h2>
            <Chat bookingId={id} meId={user._id} />
          </section>
        )}
      </div>
    </main>
  );
}
