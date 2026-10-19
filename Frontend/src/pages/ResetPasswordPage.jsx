import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';

export default function ResetPasswordPage() {
  // The reset link looks like /reset-password?token=...
  const [params] = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/api/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          Fix<span>Mate</span>
        </div>

        {!token ? (
          <>
            <div className="alert alert-error">
              This reset link is missing its token. Please request a new one.
            </div>
            <div className="auth-switch">
              <Link to="/forgot-password">Request a new link</Link>
            </div>
          </>
        ) : done ? (
          <>
            <div className="alert alert-success">
              Your password has been reset. You can now log in with it.
            </div>
            <Link to="/login" className="btn btn-primary btn-block">
              Go to log in
            </Link>
          </>
        ) : (
          <>
            <p className="auth-sub">Choose a new password for your account.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Saving…' : 'Reset password'}
              </button>
            </form>

            <div className="auth-switch">
              <Link to="/login">Back to log in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}