import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const HOME_BY_ROLE = {
  CUSTOMER: '/services',
  PROVIDER: '/provider/services',
  ADMIN: '/admin/dashboard',
};

// Login / register popup that sits on top of the landing page.
// mode is "login" or "register" and comes from the route (/login, /register).
// The customer / professional toggle only matters when registering: on login
// the backend already knows the account's role and we redirect by that.
export default function AuthModal({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('CUSTOMER');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const close = () => navigate('/');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && navigate('/');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Same data the old pages sent to the backend.
    const result = isRegister
      ? await register({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          email: form.email,
          password: form.password,
          phone: form.phone,
          role,
        })
      : await login(form.email, form.password);

    setLoading(false);
    if (result.success) {
      navigate(HOME_BY_ROLE[result.role] || '/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="lp-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="lp-auth-modal" role="dialog" aria-modal="true">
        <button type="button" className="lp-modal-close" aria-label="Close" onClick={close}>
          <Icon name="close" />
        </button>

        <div className="lp-logo">
          <span>
            <Icon name="tool" size={20} />
          </span>
          FixMate
        </div>

        <div className="lp-auth-heading">
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p>
            {isRegister
              ? 'Join FixMate and get things done.'
              : 'Sign in to continue to your account.'}
          </p>
        </div>

        <div className="lp-role-toggle">
            <button
              type="button"
              className={role === 'CUSTOMER' ? 'lp-active' : ''}
              onClick={() => setRole('CUSTOMER')}
            >
              I’m a customer
            </button>
            <button
              type="button"
              className={role === 'PROVIDER' ? 'lp-active' : ''}
              onClick={() => setRole('PROVIDER')}
            >
              I’m a professional
            </button>
          </div>

        {error && <div className="lp-auth-error">{error}</div>}
        {isRegister && role === 'PROVIDER' && (
          <div className="lp-auth-note">
            Professional accounts need admin approval before you can list services.
          </div>
        )}

        <form className="lp-form-stack" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="lp-form-row">
              <label>
                First name
                <input
                  required
                  autoFocus
                  placeholder="Sahan"
                  value={form.firstName}
                  onChange={update('firstName')}
                />
              </label>
              <label>
                Last name
                <input
                  required
                  placeholder="Perera"
                  value={form.lastName}
                  onChange={update('lastName')}
                />
              </label>
            </div>
          )}

          <label>
            Email address
            <input
              required
              autoFocus={!isRegister}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
            />
          </label>

          {isRegister && (
            <label>
              Phone number
              <input
                required
                type="tel"
                placeholder="077 123 4567"
                value={form.phone}
                onChange={update('phone')}
              />
            </label>
          )}

          <label>
            Password
            <input
              required
              type="password"
              minLength={isRegister ? 6 : undefined}
              placeholder={isRegister ? 'At least 6 characters' : 'Enter your password'}
              value={form.password}
              onChange={update('password')}
            />
          </label>

          {!isRegister && (
            <Link to="/forgot-password" className="lp-text-button lp-forgot">
              Forgot password?
            </Link>
          )}

          <button
            type="submit"
            className="lp-btn lp-btn-primary lp-btn-block"
            disabled={loading}
          >
            {loading
              ? isRegister
                ? 'Creating account…'
                : 'Signing in…'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p className="lp-auth-switch">
          {isRegister ? 'Already have an account?' : 'New to FixMate?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
