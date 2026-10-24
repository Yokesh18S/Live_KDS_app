import React, { useState } from 'react';
import { X, Lock, Mail, ShieldAlert, ShieldCheck, LogIn, LogOut, Key } from 'lucide-react';
import { kdsService } from '../services/api';
import { saveAuthSession } from '../services/storage';

export const LoginModal = ({ isOpen, onClose, currentUser, onLoginSuccess, onLogout }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('admin@foodapp.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter admin email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await kdsService.login(email.trim(), password.trim(), 'SUPER_ADMIN');
      const adminUser = res.user || { email, role: 'SUPER_ADMIN', name: 'Super Admin' };
      await saveAuthSession(res.access_token, adminUser);
      onLoginSuccess(adminUser);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid super admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#14171f',
        border: '1px solid #262c3a',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        padding: '24px',
        color: '#fff',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fc8019',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {currentUser ? 'Admin Account' : 'Super Admin Sign In'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Multi-Hotel KOT & KDS Administration
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#1a1e27', padding: '14px', borderRadius: '10px', border: '1px solid #262c3a' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Currently Active Admin:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {currentUser.name || currentUser.email}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fc8019', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Key size={12} />
                <span>ROLE: SUPER_ADMIN</span>
              </div>
            </div>

            <button 
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                height: '42px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Log Out of Super Admin</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{
              background: 'rgba(252, 128, 25, 0.1)',
              border: '1px solid rgba(252, 128, 25, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#fc8019',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Key size={14} />
              <span>Login restricted to Super Admin credentials</span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email"
                  required
                  placeholder="admin@foodapp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    background: '#1a1e27',
                    border: '1px solid #262c3a',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Admin Password
              </label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#1a1e27',
                  border: '1px solid #262c3a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                height: '44px',
                background: '#fc8019',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In as Super Admin'}</span>
            </button>

            <div style={{
              fontSize: '0.78rem',
              color: '#64748b',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Default: <strong style={{ color: '#94a3b8' }}>admin@foodapp.com</strong> / <strong style={{ color: '#94a3b8' }}>admin123</strong>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
