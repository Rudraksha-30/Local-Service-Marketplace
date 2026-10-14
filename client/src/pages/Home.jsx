import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { categoryLabel, SIGNALS } from '../lib.js';
import TrustDial from '../components/TrustDial.jsx';
import SignalBars from '../components/SignalBars.jsx';
import ProviderCard from '../components/ProviderCard.jsx';
import { VerifiedMark } from '../components/bits.jsx';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState([]);
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.get('/providers/meta/categories').then((d) => setCategories(d.categories)).catch(() => {});
    api.get('/providers?limit=3').then((d) => setTop(d.providers)).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/providers${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const featured = top[0];

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>Hire local pros you can actually check.</h1>
            <p className="lead">
              Every provider has a Trust Score built from jobs they finish, recent reviews, how fast they reply and disputes
              upheld against them. You see the numbers behind it before you book.
            </p>
            <form className="search" onSubmit={search} role="search">
              <input aria-label="What do you need done?" placeholder="Plumber, electrician, cleaning…" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn btn-accent" type="submit">Search</button>
            </form>
            {categories.length > 0 && (
              <div className="quick">
                <span className="muted small">Popular:</span>
                {categories.slice(0, 6).map((c) => (
                  <Link key={c} className="chip" to={`/providers?category=${encodeURIComponent(c)}`}>{categoryLabel(c)}</Link>
                ))}
              </div>
            )}
          </div>

          {featured ? (
            <Link to={`/providers/${featured._id}`} className="hero-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="hero-card-top">
                <TrustDial score={featured.trust.score} isNew={featured.trust.isNewProvider} size={132} />
                <div>
                  <h3 style={{ marginBottom: 2 }}>
                    {featured.user?.name}
                    {featured.isVerified && <VerifiedMark />}
                  </h3>
                  <p className="muted small" style={{ margin: 0 }}>{featured.headline}</p>
                </div>
              </div>
              <SignalBars breakdown={featured.trust.breakdown} compact />
            </Link>
          ) : (
            <div className="hero-card">
              <h3>How a score is built</h3>
              <p className="muted small">Providers start at a neutral 50 and move up or down as real jobs happen.</p>
              <SignalBars breakdown={null} compact />
            </div>
          )}
        </div>
      </section>

      <div className="container">
        <section className="section">
          <h2>How the Trust Score works</h2>
          <p className="muted" style={{ maxWidth: '44em' }}>
            Four signals, weighted by how hard each one is to fake. A provider with no history starts at 50 and the score moves
            toward their real record as they complete more jobs.
          </p>
          <div className="weights" role="img" aria-label="Weights: finishes jobs 40 percent, ratings 30 percent, replies quickly 20 percent, disputes 10 percent">
            {SIGNALS.map((s) => (
              <span key={s.key} style={{ width: `${s.weight}%` }}>{s.weight}%</span>
            ))}
          </div>
          <div className="explain">
            {SIGNALS.map((s) => (
              <div key={s.key}>
                <h3>{s.label}</h3>
                <p>{s.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {top.length > 0 && (
          <section className="section">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Highest trust scores right now</h2>
              <Link to="/providers">See all providers</Link>
            </div>
            <div className="cards">
              {top.map((p) => <ProviderCard key={p._id} provider={p} />)}
            </div>
          </section>
        )}

        {user?.role !== 'provider' && user?.role !== 'admin' && (
          <section className="section">
            <div className="cta-band">
              <div>
                <h2>Offer a service?</h2>
                <p>List what you do and earn a score customers can see.</p>
              </div>
              <Link className="btn btn-accent" to="/register?role=provider">Join as a provider</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
