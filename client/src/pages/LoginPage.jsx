import React, { useState } from 'react';
import { Factory, Leaf, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage = ({ onLogin, users = [] }) => {
  const [username, setUsername] = useState('sarah.lin');
  const [password, setPassword] = useState('FootprintESG2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await onLogin(username, password);
      if (!res.success) {
        setError(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setUsername(user.username);
    setPassword('FootprintESG2026!');
    setError('');
    setLoading(true);
    try {
      await onLogin(user.username, 'FootprintESG2026!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="login-title">FootprintESG</h1>
            <p className="login-subtitle">Factory Operations & Utility Tracking</p>
          </div>
        </div>

        {error && (
          <div className="login-error-alert" role="alert">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="e.g. sarah.lin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            <span>{loading ? 'Verifying...' : 'Sign In to Plant Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Role Switcher for Factory Roles */}
        <div className="quick-roles-section">
          <div className="quick-roles-title">
            <span>Or Sign In as Factory Team:</span>
          </div>

          <div className="quick-roles-grid">
            {users.slice(0, 5).map((u) => {
              const roleLabel = 
                u.role === 'SUSTAINABILITY_MANAGER' ? 'Sustainability Lead' :
                u.role === 'PLANT_COORDINATOR' ? 'Plant Coordinator' :
                u.role === 'PLANT_MANAGER' ? 'Plant Director' :
                u.role === 'AUDITOR' ? 'Data Auditor' :
                u.role === 'EXECUTIVE' ? 'Executive' : 'IT Admin';

              return (
                <button
                  key={u.userId || u.username}
                  type="button"
                  className="quick-role-btn"
                  onClick={() => handleQuickLogin(u)}
                  disabled={loading}
                >
                  <div className="quick-role-info">
                    <span className="quick-role-name">{(u.name || u.fullName || u.username).split(' (')[0]}</span>
                    <span className="quick-role-badge">{roleLabel}</span>
                  </div>
                  <ArrowRight size={13} className="quick-role-arrow" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="login-footer">
          <span>Global Industrial Corp • 4 Manufacturing Sites</span>
        </div>
      </div>
    </div>
  );
};
