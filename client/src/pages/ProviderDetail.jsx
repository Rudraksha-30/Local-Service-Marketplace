import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { categoryLabel, fmtDate, localInputValue, priceRange } from "../lib.js";
import TrustDial from "../components/TrustDial.jsx";
import SignalBars from "../components/SignalBars.jsx";
import { Empty, Notice, VerifiedMark } from "../components/bits.jsx";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

function BookingForm({ profile }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const minStart = localInputValue(new Date(Date.now() + 60 * 60 * 1000));
  const [form, setForm] = useState({
    category: profile.categories[0] || "",
    when: "",
    durationMinutes: "60",
    address: "",
    notes: "",
  });

  const leaveConflict = (() => {
    if (!form.when || !profile.leaveStart || !profile.leaveEnd) {
      return false;
    }

    const bookingStart = new Date(form.when);
    const bookingEnd = new Date(
      bookingStart.getTime() + Number(form.durationMinutes) * 60 * 1000,
    );

    const leaveStart = new Date(profile.leaveStart);
    const leaveEnd = new Date(profile.leaveEnd);

    return bookingStart <= leaveEnd && bookingEnd > leaveStart;
  })();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const [cameraMode, setCameraMode] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [capturedPreview, setCapturedPreview] = useState(null);

  const validateAndAddFiles = (files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        errors.push(`${file.name}: only images and videos are allowed.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: the file exceeds 2 MB.`);
      } else {
        validFiles.push(file);
      }
    });

    setAttachments((previous) => [...previous, ...validFiles]);
    setAttachmentError(errors.join(" "));
  };

  const handleAttachmentChange = (event) => {
    validateAndAddFiles(event.target.files);
    event.target.value = "";
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
    setAttachmentError("");
  };

  const handleCameraCapture = (event) => {
    validateAndAddFiles(event.target.files);
    event.target.value = "";
    setCameraMode(null);
  };

  const closeCamera = () => {
    setCameraMode(null);
    setCameraError("");
  };

  if (!user) {
    return (
      <div className="panel sticky">
        <h3>Book {profile.user?.name}</h3>
        <p className="muted">Sign in as a customer to request a time.</p>
        <Link
          className="btn btn-accent btn-block"
          to={`/login?next=${encodeURIComponent(location.pathname)}`}
        >
          Sign in to book
        </Link>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
          New here?{" "}
          <Link to={`/register?next=${encodeURIComponent(location.pathname)}`}>
            Create an account
          </Link>
        </p>
      </div>
    );
  }
  if (user.role !== "customer") {
    return (
      <div className="panel sticky">
        <h3>Booking</h3>
        <p className="muted" style={{ margin: 0 }}>
          Only customer accounts can book a provider.
        </p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (leaveConflict) {
      setError("This provider is on leave during the selected booking time.");
      return;
    }
    setError("");

    if (!form.when) {
      return setError("Choose a date and time for the visit.");
    }

    setBusy(true);

    try {
      const bookingData = new FormData();

      bookingData.append("providerId", profile.user._id);
      bookingData.append("category", form.category);
      bookingData.append("scheduledStart", new Date(form.when).toISOString());
      bookingData.append("durationMinutes", Number(form.durationMinutes));

      if (form.address.trim()) {
        bookingData.append("address", form.address.trim());
      }

      if (form.notes.trim()) {
        bookingData.append("notes", form.notes.trim());
      }

      attachments.forEach((file) => {
        bookingData.append("attachments", file);
      });

      const d = await api.post("/bookings", bookingData);
      navigate(`/bookings/${d.booking._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="panel sticky" onSubmit={submit}>
      <h3>Book {profile.user?.name}</h3>
      <Notice>{error}</Notice>
      <div className="field">
        <label htmlFor="b-cat">Service</label>
        <select
          id="b-cat"
          value={form.category}
          onChange={set("category")}
          required
        >
          {profile.categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="b-when">Date and time</label>
        <input
          id="b-when"
          type="datetime-local"
          min={minStart}
          value={form.when}
          onChange={set("when")}
          required
        />

        {leaveConflict && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            This provider is on leave during your selected booking time. Please
            choose another date.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="b-dur">How long</label>
        <select
          id="b-dur"
          value={form.durationMinutes}
          onChange={set("durationMinutes")}
        >
          {[30, 60, 90, 120, 180, 240].map((m) => (
            <option key={m} value={m}>
              {m >= 60
                ? `${m / 60} ${m === 60 ? "hour" : "hours"}`
                : `${m} minutes`}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="b-addr">Address</label>
        <input
          id="b-addr"
          value={form.address}
          onChange={set("address")}
          maxLength={200}
          placeholder="Where should they come?"
        />
      </div>

      <div className="field">
        <label htmlFor="booking-file-upload">
          Photos and videos (optional)
        </label>

        <input
          id="booking-file-upload"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleAttachmentChange}
        />

        <p className="field-hint">
          Upload photos or videos to explain the work needed. Maximum 2 MB per
          file.
        </p>

        {attachmentError && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {attachmentError}
          </p>
        )}

        {attachments.length > 0 && (
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {attachments.map((file, index) => (
              <AttachmentPreview
                key={`${file.name}-${file.size}-${index}`}
                file={file}
                onRemove={() => removeAttachment(index)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        <label htmlFor="b-notes">Notes for the provider</label>
        <textarea
          id="b-notes"
          value={form.notes}
          onChange={set("notes")}
          maxLength={500}
          placeholder="What needs doing?"
        />
      </div>
      <button
        className="btn btn-accent btn-block"
        type="submit"
        disabled={busy || leaveConflict}
      >
        {busy ? "Sending…" : "Request booking"}
      </button>
      <p className="field-hint">
        The provider will accept or decline. You can chat once they reply.
      </p>
    </form>
  );
}

function AttachmentPreview({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 10,
        marginTop: 10,
        border: "1px solid #d1d5db",
        borderRadius: 8,
      }}
    >
      {previewUrl && file.type.startsWith("image/") && (
        <img
          src={previewUrl}
          alt={`Preview of ${file.name}`}
          style={{
            width: 110,
            height: 90,
            objectFit: "cover",
            borderRadius: 6,
            flexShrink: 0,
          }}
        />
      )}

      {previewUrl && file.type.startsWith("video/") && (
        <video
          src={previewUrl}
          controls
          preload="metadata"
          style={{
            width: 150,
            maxWidth: "45%",
            maxHeight: 120,
            borderRadius: 6,
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ overflowWrap: "anywhere" }}>{file.name}</div>

        <div className="small muted" style={{ marginTop: 4 }}>
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onRemove}
          style={{ marginTop: 8 }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function ProviderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setError("");
    api
      .get(`/providers/${id}`)
      .then((d) => !cancelled && setProfile(d.profile))
      .catch((e) => !cancelled && setError(e.message));
    api
      .get(`/providers/${id}/reviews`)
      .then((d) => !cancelled && setReviews(d.reviews))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="container page">
        <Notice>{error}</Notice>
        <Link to="/providers">Back to all providers</Link>
      </main>
    );
  }
  if (!profile)
    return (
      <main className="container page">
        <p className="muted">Loading provider…</p>
      </main>
    );

  const { trust } = profile;
  return (
    <main className="container page">
      {(!user || user.role === "customer") && (
        <p className="small">
          <Link to="/providers">All providers</Link>
        </p>
      )}
      <div className="detail">
        <div className="stack">
          <div className="panel">
            <div className="detail-head">
              <TrustDial
                score={trust.score}
                isNew={trust.isNewProvider}
                size={150}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h1 style={{ fontSize: "2rem", marginBottom: 4 }}>
                  {profile.user?.name}
                  {profile.isVerified && <VerifiedMark />}
                </h1>
                <p style={{ margin: "0 0 6px" }}>{profile.headline}</p>
                <div className="chips">
                  {profile.categories.map((c) => (
                    <span key={c} className="chip">
                      {categoryLabel(c)}
                    </span>
                  ))}
                </div>
                <p className="muted small" style={{ margin: 0 }}>
                  {profile.serviceArea || "Area not set"} ·{" "}
                  {priceRange(profile.priceMin, profile.priceMax)} ·{" "}
                  {trust.reviewCount}{" "}
                  {trust.reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
            {profile.description && (
              <p style={{ marginTop: 18, marginBottom: 0 }}>
                {profile.description}
              </p>
            )}
          </div>

          <div className="panel">
            <h2>Why this score</h2>
            {trust.isNewProvider && trust.reviewCount < 3 && (
              <Notice kind="info">
                New provider: fewer than 3 reviews so far, so the score is still
                settling.
              </Notice>
            )}
            <SignalBars breakdown={trust.breakdown} />
          </div>

          <div className="panel">
            <h2>Reviews</h2>
            {reviews.length === 0 ? (
              <Empty title="No reviews yet">
                Reviews appear here after a customer finishes a booking with
                this provider.
              </Empty>
            ) : (
              reviews.map((r) => (
                <div className="review" key={r._id}>
                  <div className="row-between">
                    <strong>{r.customer?.name}</strong>
                    <span className="muted small">{fmtDate(r.createdAt)}</span>
                  </div>
                  <div
                    className="stars"
                    aria-label={`${r.rating} out of 5 stars`}
                  >
                    {stars(r.rating)}
                  </div>
                  {r.comment && (
                    <p style={{ margin: "4px 0 0" }}>{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <BookingForm profile={profile} />
      </div>
    </main>
  );
}
