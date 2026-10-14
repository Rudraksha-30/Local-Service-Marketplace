import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { categoryLabel } from '../lib.js';
import ProviderCard from '../components/ProviderCard.jsx';
import { Empty, Notice } from '../components/bits.jsx';

export default function Providers() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const area = params.get('area') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const [draft, setDraft] = useState({ q, area });
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/providers/meta/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => setDraft({ q, area }), [q, area]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    const qs = new URLSearchParams({ page, limit: 8 });
    if (q) qs.set('q', q);
    if (category) qs.set('category', category);
    if (area) qs.set('area', area);
    api
      .get(`/providers?${qs}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [q, category, area, page]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const submit = (e) => {
    e.preventDefault();
    update({ q: draft.q.trim(), area: draft.area.trim() });
  };

  const hasFilters = q || category || area;

  return (
    <main className="container page">
      <h1 style={{ fontSize: '2rem' }}>Find a pro</h1>
      <p className="muted">Sorted by Trust Score, highest first.</p>

      <form className="filters" onSubmit={submit} role="search">
        <div className="field">
          <label htmlFor="f-q">Search</label>
          <input id="f-q" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Leak repair, wiring…" />
        </div>
        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select id="f-cat" value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-area">City or area</label>
          <input id="f-area" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} placeholder="Jaipur" />
        </div>
        <button className="btn" type="submit">Apply</button>
      </form>

      <Notice>{error}</Notice>

      {!data && !error && <p className="muted">Loading providers…</p>}

      {data && data.providers.length === 0 && (
        <Empty title="No providers match">
          Try a different category or clear the filters.{' '}
          {hasFilters && <button className="btn btn-ghost btn-sm" onClick={() => setParams({})}>Clear filters</button>}
        </Empty>
      )}

      {data && data.providers.length > 0 && (
        <>
          <p className="muted small">{data.total} {data.total === 1 ? 'provider' : 'providers'}</p>
          <div className="cards">
            {data.providers.map((p) => <ProviderCard key={p._id} provider={p} />)}
          </div>
          {data.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
              <span className="muted small">Page {data.page} of {data.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
