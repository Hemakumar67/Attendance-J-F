import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { authService } from './services/auth';
import { Login } from './components/Login';
import { SummaryTable } from './components/SummaryTable';

export const App = () => {
  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserContext = async () => {
    if (!authService.isAuthenticated()) {
      setUserContext(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUserContext(data);
    } catch (err) {
      authService.clearSession();
      setUserContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserContext();
  }, []);

  const handleSignOut = () => {
    authService.clearSession();
    setUserContext(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Loading session context...
      </div>
    );
  }

  if (!userContext) {
    return <Login onLoginSuccess={loadUserContext} />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(135deg, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Attendance Gaps
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tenant: <strong>{userContext.company.name}</strong> ({userContext.company.id})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userContext.user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Role: <strong style={{ color: 'var(--accent-blue)' }}>{userContext.user.roleId}</strong> ({userContext.user.region})
              </div>
            </div>

            <button className="btn btn-secondary" onClick={handleSignOut} style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <SummaryTable userContext={userContext} />
      </main>
    </div>
  );
};

export default App;
