import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="container page">
      <h1>Page not found</h1>
      <p className="muted">The address may be mistyped, or the page has moved.</p>
      <Link className="btn" to="/">Go to the home page</Link>
    </main>
  );
}
