/**
 * Register Page
 * New user registration with role selection
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Enter a valid email';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

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
      const { confirmPassword, ...registerData } = form;
      const user = await register(registerData);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
      : form.password.length < 10 ? 2 : 3;

  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--accent-red)', 'var(--accent-orange)', 'var(--accent-green)'];

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" />

      <div className="auth-card fade-in-up" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🔬</div>
          <div>
            <div className="auth-logo-text">LabBook</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Equipment Booking System</div>
          </div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join the lab booking portal</p>

        {errors.general && (
          <div className="alert-custom alert-error mb-3">
            <i className="bi bi-exclamation-circle"></i> {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* Role Selector */}
          <div className="mb-3">
            <label className="form-label-custom">I am a</label>
            <div className="d-flex gap-2">
              {['student', 'admin', 'superadmin'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, role }))}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${form.role === role ? 'var(--accent-blue)' : 'var(--border)'}`,
                    background: form.role === role ? 'rgba(88,166,255,0.1)' : 'var(--bg-secondary)',
                    color: form.role === role ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    transition: 'all 0.2s ease', textTransform: 'capitalize'
                  }}
                >
                  <i className={`bi ${role === 'admin' ? 'bi-shield-check' : 'bi-mortarboard'} me-1`}></i>
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="mb-3">
            <label className="form-label-custom">Full Name</label>
            <input type="text" name="name" className="form-control-custom"
              placeholder="Dr. Jane Smith" value={form.name} onChange={handleChange} />
            {errors.name && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label-custom">Email Address</label>
            <input type="email" name="email" className="form-control-custom"
              placeholder="you@university.edu" value={form.email} onChange={handleChange} />
            {errors.email && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label-custom">Password</label>
            <input type="password" name="password" className="form-control-custom"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
            {form.password && (
              <div className="d-flex align-items-center gap-2 mt-1">
                <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(strength / 3) * 100}%`,
                    background: strengthColor[strength],
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: strengthColor[strength], fontWeight: 600, minWidth: 40 }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
            {errors.password && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="form-label-custom">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-control-custom"
              placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            {errors.confirmPassword && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            className="btn-primary-custom w-100"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Creating account...</>
            ) : (
              <><i className="bi bi-person-plus me-1"></i>Create Account</>
            )}
          </button>
        </form>

        <div className="auth-divider" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
