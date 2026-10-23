import React, { useState } from 'react';
import { X, Lock, Mail, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { kdsService } from '../services/api';

export const LoginModal = ({ isOpen, onClose, currentUser, onLoginSuccess, onLogout }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HOTEL_ADMIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await kdsService.login(email, password, role);
      onLoginSuccess(res.user || { email, role });
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
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
      background: 'rgba(0, 0, 0, 0.75)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#1a1e27',
        border: '1px solid #374151',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '380px',
        padding: '24px',
        color: '#fff',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            {currentUser ? 'Kitchen Staff Account' : 'Staff Login'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#14171f', padding: '12px', borderRadius: '8px', border: '1px solid #262c3a' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Currently Logged In:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {currentUser.name || currentUser.email}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                Role: {currentUser.role}
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
                borderRadius: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Staff Role
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#14171f',
                  border: '1px solid #262c3a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '0.85rem'
                }}
              >
                <option value="HOTEL_ADMIN">Hotel Admin / Manager</option>
                <option value="CASHIER">Cashier / POS</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email"
                  required
                  placeholder="manager@udipi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: '#14171f',
                    border: '1px solid #262c3a',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0 10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#14171f',
                  border: '1px solid #262c3a',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                height: '42px',
                background: '#fc8019',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In to KDS'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
