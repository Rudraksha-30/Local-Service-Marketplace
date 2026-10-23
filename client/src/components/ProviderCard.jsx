import { Link } from "react-router-dom";
import TrustDial from "./TrustDial.jsx";
import { VerifiedMark } from "./bits.jsx";
import { categoryLabel, priceRange } from "../lib.js";

export default function ProviderCard({ provider }) {
  const { trust } = provider;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaveStart = provider.leaveStart ? new Date(provider.leaveStart) : null;

  const leaveEnd = provider.leaveEnd ? new Date(provider.leaveEnd) : null;

  if (leaveStart) leaveStart.setHours(0, 0, 0, 0);
  if (leaveEnd) leaveEnd.setHours(0, 0, 0, 0);

  const isOnLeave =
    leaveStart && leaveEnd && today >= leaveStart && today <= leaveEnd;

  return (
    <Link to={`/providers/${provider._id}`} className="pcard">
      <div className="pcard-main">
        <h3>
          {provider.user?.name}
          {provider.isVerified && <VerifiedMark />}
        </h3>

        {isOnLeave && (
          <span
            className="chip"
            style={{
              display: "inline-block",
              marginBottom: 8,
              background: "#fff0f0",
              color: "#b91c1c",
              borderColor: "#fecaca",
            }}
          >
            On Leave
          </span>
        )}

        <p className="pcard-headline">
          {provider.headline || "No headline yet"}
        </p>

        <div className="chips">
          {provider.categories.map((c) => (
            <span key={c} className="chip">
              {categoryLabel(c)}
            </span>
          ))}
        </div>

        <p className="muted small">
          {provider.serviceArea || "Area not set"} ·{" "}
          {priceRange(provider.priceMin, provider.priceMax)}
        </p>
      </div>

      <div className="pcard-score">
        <TrustDial score={trust.score} isNew={trust.isNewProvider} size={92} />
        <span className="muted small">
          {trust.reviewCount} {trust.reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>
    </Link>
  );
}
