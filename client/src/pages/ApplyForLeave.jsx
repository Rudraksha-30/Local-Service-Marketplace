
import { useState } from 'react';
import { api } from '../api.js';
import { Notice } from '../components/bits.jsx';

export default function ApplyForLeave() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!startDate || !endDate) {
      setError('Please select both leave dates.');
      return;
    }

    if (startDate < minDate) {
      setError('Leave cannot start in the past.');
      return;
    }

    if (endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    setBusy(true);

    try {
      const result = await api.post('/providers/me/leave', {
        startDate,
        endDate,
      });

      setMessage(result.message || 'Leave applied successfully.');
    } catch (err) {
      setError(err.message || 'Unable to apply for leave.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container page">
      <h1 style={{ fontSize: '2rem' }}>Apply for Leave</h1>
      <p className="muted">
        Choose the dates when you will be unavailable for bookings.
      </p>

      <div className="panel" style={{ maxWidth: 600 }}>
        <Notice>{error}</Notice>

        {message && (
          <p role="status" style={{ color: 'green' }}>
            {message}
          </p>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="leave-start">Start date</label>
            <input
              id="leave-start"
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="leave-end">End date</label>
            <input
              id="leave-end"
              type="date"
              min={startDate || minDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <button
            className="btn btn-accent"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Applying…' : 'Apply for Leave'}
          </button>
        </form>
      </div>
    </main>
  );
}
