import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import TrustDial from '../components/TrustDial.jsx';
import SignalBars from '../components/SignalBars.jsx';
import { Notice, VerifiedMark } from '../components/bits.jsx';

export default function MyListing() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const fill = (p) => {
    setProfile(p);
    setForm({
      headline: p.headline || '',
      description: p.description || '',
      categories: (p.categories || []).join(', '),
      serviceArea: p.serviceArea || '',
      priceMin: p.priceMin ?? '',
      priceMax: p.priceMax ?? '',
      isActive: p.isActive !== false,
    });
  };

  useEffect(() => {
    api.get('/providers/me/profile').then((d) => fill(d.profile)).catch((e) => setError(e.message));
  }, []);

  if (!form) return <main className="container page">{error ? <Notice>{error}</Notice> : <p className="muted">Loading your listing…</p>}</main>;

  const set = (k) => (e) => {
    setSaved(false);
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    const categories = form.categories.split(',').map((c) => c.trim()).filter(Boolean);
    if (categories.length === 0) return setError('Add at least one service category, for example plumbing.');
    if (form.priceMin !== '' && form.priceMax !== '' && Number(form.priceMin) > Number(form.priceMax)) {
      return setError('The lowest price cannot be higher than the highest price.');
    }
    setBusy(true);
    try {
      const d = await api.put('/providers/me/profile', {
        headline: form.headline.trim(),
        description: form.description.trim(),
        categories,
        serviceArea: form.serviceArea.trim(),
        ...(form.priceMin !== '' ? { priceMin: Number(form.priceMin) } : {}),
        ...(form.priceMax !== '' ? { priceMax: Number(form.priceMax) } : {}),
        isActive: form.isActive,
      });
      fill(d.profile);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const { trust } = profile;
  const incomplete = !profile.headline || profile.categories.length === 0 || !profile.serviceArea;

  return (
    <main className="container page">
      <h1 style={{ fontSize: '2rem' }}>My listing</h1>
      {incomplete && <Notice kind="info">Add a headline, at least one category and your service area so customers can find you.</Notice>}

      <div className="detail">
        <form className="panel" onSubmit={submit}>
          <Notice>{error}</Notice>
          {saved && <Notice kind="success">Listing saved.</Notice>}
          <div className="field">
            <label htmlFor="headline">Headline</label>
            <input id="headline" value={form.headline} onChange={set('headline')} maxLength={120} placeholder="Leaks, pipes and bathroom fittings fixed the same day" />
          </div>
          <div className="field">
            <label htmlFor="description">About your work</label>
            <textarea id="description" value={form.description} onChange={set('description')} maxLength={1000} />
          </div>
          <div className="field">
            <label htmlFor="categories">Services you offer</label>
            <input id="categories" value={form.categories} onChange={set('categories')} placeholder="plumbing, drainage" />
            <p className="field-hint">Separate with commas. Customers book by these names.</p>
          </div>
          <div className="field">
            <label htmlFor="area">City or area</label>
            <input id="area" value={form.serviceArea} onChange={set('serviceArea')} placeholder="Jaipur" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="pmin">Lowest price (₹)</label>
              <input id="pmin" type="number" min="0" value={form.priceMin} onChange={set('priceMin')} />
            </div>
            <div className="field">
              <label htmlFor="pmax">Highest price (₹)</label>
              <input id="pmax" type="number" min="0" value={form.priceMax} onChange={set('priceMax')} />
            </div>
          </div>
          <label className="check" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
            Show my listing to customers
          </label>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button>
        </form>

        <aside className="panel sticky">
          <div className="row" style={{ gap: 16, marginBottom: 14 }}>
            <TrustDial score={trust.score} isNew={trust.isNewProvider} size={110} />
            <div>
              <h3 style={{ margin: 0 }}>Your Trust Score</h3>
              <p className="muted small" style={{ margin: 0 }}>{trust.reviewCount} {trust.reviewCount === 1 ? 'review' : 'reviews'}</p>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {profile.isVerified ? <VerifiedMark /> : <span className="muted">Not verified yet. An admin checks new providers.</span>}
              </p>
            </div>
          </div>
          <SignalBars breakdown={trust.breakdown} compact />
          {profile.isActive && !incomplete && <p style={{ marginTop: 16, marginBottom: 0 }}><Link to={`/providers/${profile._id}`}>View your public page</Link></p>}
        </aside>
      </div>
    </main>
  );
}
