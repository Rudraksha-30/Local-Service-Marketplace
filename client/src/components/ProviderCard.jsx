import { Link } from 'react-router-dom';
import TrustDial from './TrustDial.jsx';
import { VerifiedMark } from './bits.jsx';
import { categoryLabel, priceRange } from '../lib.js';

export default function ProviderCard({ provider }) {
  const { trust } = provider;
  return (
    <Link to={`/providers/${provider._id}`} className="pcard">
      <div className="pcard-main">
        <h3>
          {provider.user?.name}
          {provider.isVerified && <VerifiedMark />}
        </h3>
        <p className="pcard-headline">{provider.headline || 'No headline yet'}</p>
        <div className="chips">
          {provider.categories.map((c) => (
            <span key={c} className="chip">{categoryLabel(c)}</span>
          ))}
        </div>
        <p className="muted small">
          {provider.serviceArea || 'Area not set'} · {priceRange(provider.priceMin, provider.priceMax)}
        </p>
      </div>
      <div className="pcard-score">
        <TrustDial score={trust.score} isNew={trust.isNewProvider} size={92} />
        <span className="muted small">{trust.reviewCount} {trust.reviewCount === 1 ? 'review' : 'reviews'}</span>
      </div>
    </Link>
  );
}
