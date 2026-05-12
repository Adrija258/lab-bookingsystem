/**
 * Login Page
 * JWT-based authentication with form validation
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Frontend validation
  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  // Quick demo fill
  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@lab.com', password: 'Lab@Admin2026' });
    else setForm({ email: 'student@lab.com', password: 'Lab@Student2026' });
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" />

      <div className="auth-card fade-in-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🔬</div>
          <div>
            <div className="auth-logo-text">LabBook</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Equipment Booking System</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access the lab booking portal</p>

        {/* Demo credentials */}
        <div style={{
          background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.15)',
          borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            DEMO ACCOUNTS
          </p>
          <div className="d-flex gap-2">
            <button className="btn-outline-custom" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }} onClick={() => fillDemo('admin')}>
              <i className="bi bi-shield-fill"></i> Admin
            </button>
            <button className="btn-outline-custom" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }} onClick={() => fillDemo('student')}>
              <i className="bi bi-mortarboard-fill"></i> Student
            </button>
          </div>
        </div>

        {/* Error alert */}
        {errors.general && (
          <div className="alert-custom alert-error mb-3">
            <i className="bi bi-exclamation-circle"></i> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* Email */}
          <div className="mb-3">
            <label className="form-label-custom">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-control-custom"
                placeholder="you@university.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                style={{ paddingLeft: '2.25rem' }}
              />
              <i className="bi bi-envelope" style={{
                position: 'absolute', left: '0.75rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem'
              }}></i>
            </div>
            {errors.email && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="form-label-custom">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control-custom"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
              />
              <i className="bi bi-lock" style={{
                position: 'absolute', left: '0.75rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem'
              }}></i>
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', padding: 0
              }}>
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
            {errors.password && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary-custom w-100"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in...</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-1"></i>Sign In</>
            )}
          </button>
        </form>

        <div className="auth-divider" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
