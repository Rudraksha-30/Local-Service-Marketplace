import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { homeFor } from '../lib.js';
import { Notice } from '../components/bits.jsx';

// Only follow same-site paths from ?next= so a crafted link cannot send people to another website.
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(next || homeFor(user), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="container page">
      <div className="auth-wrap">
        <h1 style={{ fontSize: '2rem' }}>Sign in</h1>
        <form className="panel" onSubmit={submit}>
          <Notice>{error}</Notice>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          No account yet? <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Create one</Link>
        </p>
      </div>
    </main>
  );
}
