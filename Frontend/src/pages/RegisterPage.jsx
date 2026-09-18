import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HOME_BY_ROLE = {
  CUSTOMER: '/services',
  PROVIDER: '/provider/services',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      navigate(HOME_BY_ROLE[result.role] || '/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          Fix<span>Mate</span>
        </div>
        <p className="auth-sub">Create an account to get started.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>I am a…</label>
            <div className="role-select">
              <div
                className={`role-option ${form.role === 'CUSTOMER' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, role: 'CUSTOMER' })}
              >
                Customer
              </div>
              <div
                className={`role-option ${form.role === 'PROVIDER' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, role: 'PROVIDER' })}
              >
                Service Provider
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={update('name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={update('email')}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" required value={form.phone} onChange={update('phone')} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update('password')}
            />
          </div>

          {form.role === 'PROVIDER' && (
            <div className="alert alert-success" style={{ fontSize: 12 }}>
              Provider accounts need admin approval before you can list services.
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
