import React, { useState } from 'react';
import { api } from '../services/api';
import { authService } from '../services/auth';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email);
      authService.setSession(res.token, res.user);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail) => {
    setEmail(testEmail);
    api.login(testEmail).then(res => {
      authService.setSession(res.token, res.user);
      onLoginSuccess();
    }).catch(err => {
      setError(err.message || 'Quick login failed');
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Attendance Gaps
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Multi-Tenant Single Sign-On (SSO) Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Work Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.example"
              required
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'Signing in...' : 'Sign In with SSO'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--bg-card-border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Quick Demo Accounts (Click to test roles):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }} onClick={() => handleQuickLogin('hari@alder.example')}>
              <span><strong>Alder Works</strong> — Hari (HR Admin)</span>
              <span className="badge badge-ok">C1 HR Admin</span>
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }} onClick={() => handleQuickLogin('maya@alder.example')}>
              <span><strong>Alder Works</strong> — Maya (Manager)</span>
              <span className="badge badge-ok">C1 Manager</span>
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }} onClick={() => handleQuickLogin('asha@alder.example')}>
              <span><strong>Alder Works</strong> — Asha (Employee)</span>
              <span className="badge badge-ok">C1 Employee</span>
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }} onClick={() => handleQuickLogin('jaya@birch.example')}>
              <span><strong>Birch Infra</strong> — Jaya (HR Admin)</span>
              <span className="badge badge-gap" style={{ borderColor: '#a855f7', color: '#a855f7' }}>C2 HR Admin</span>
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }} onClick={() => handleQuickLogin('ivan@birch.example')}>
              <span><strong>Birch Infra</strong> — Ivan (Payroll Viewer)</span>
              <span className="badge badge-gap" style={{ borderColor: '#a855f7', color: '#a855f7' }}>C2 Payroll</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
