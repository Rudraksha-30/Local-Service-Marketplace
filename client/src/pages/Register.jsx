import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Notice } from '../components/bits.jsx';

const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: params.get('role') === 'provider' ? 'provider' : 'customer',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
      });
      // New providers go straight to filling in their listing; customers return to what they were doing.
      navigate(user.role === 'provider' ? '/listing' : next || '/providers', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="container page">
      <div className="auth-wrap">
        <h1 style={{ fontSize: '2rem' }}>Create your account</h1>
        <form className="panel" onSubmit={submit}>
          <Notice>{error}</Notice>
          <fieldset style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
            <legend style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: 6, padding: 0 }}>I want to</legend>
            <label className="check">
              <input type="radio" name="role" value="customer" checked={form.role === 'customer'} onChange={set('role')} />
              Book a service
            </label>
            <label className="check" style={{ marginTop: 6 }}>
              <input type="radio" name="role" value="provider" checked={form.role === 'provider'} onChange={set('role')} />
              Offer a service
            </label>
          </fieldset>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" autoComplete="name" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
            <p className="field-hint">At least 8 characters.</p>
          </div>
          <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Already have an account? <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
