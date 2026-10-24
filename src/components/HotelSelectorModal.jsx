import React, { useState, useEffect } from 'react';
import { X, Store, MapPin, User, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { kdsService } from '../services/api';

export const HotelSelectorModal = ({ isOpen, onClose, selectedHotelId, onSelectHotel, canCancel = true }) => {
  if (!isOpen) return null;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHotels = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await kdsService.getRestaurants();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels([]);
      }
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
      setErrorMsg(err.message || 'Failed to load connected hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
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
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #262c3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1e27'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={22} color="#fc8019" />
              <span>Connected Hotels & Branches</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Select a hotel branch to monitor live KOTs & KDS tickets
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={fetchHotels}
              title="Refresh hotel list"
              style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', color: '#94a3b8', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <RefreshCw size={15} />
            </button>
            {canCancel && (
              <button 
                onClick={onClose} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#fc8019' }} />
              <div>Loading connected hotel kitchens...</div>
            </div>
          ) : errorMsg ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              color: '#f87171'
            }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700 }}>Connection Error</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{errorMsg}</div>
              <button 
                onClick={fetchHotels}
                style={{ marginTop: '12px', background: '#fc8019', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : hotels.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Store size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>No connected hotels found on this server.</div>
            </div>
          ) : (
            hotels.map((hotel) => {
              const isSelected = selectedHotelId === hotel.id;
              return (
                <div
                  key={hotel.id}
                  onClick={() => onSelectHotel(hotel)}
                  style={{
                    background: isSelected ? 'rgba(252, 128, 25, 0.08)' : '#1a1e27',
                    border: isSelected ? '2px solid #fc8019' : '1px solid #262c3a',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: '#14171f',
                        border: '1px solid #262c3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Store size={18} color="#fc8019" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                          {hotel.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Branch ID #{hotel.id}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '20px'
                      }}>
                        <CheckCircle2 size={13} />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#fc8019',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        <span>Open KDS</span>
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </div>

                  {hotel.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <MapPin size={13} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hotel.address}
                      </span>
                    </div>
                  )}

                  {hotel.manager_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                      <User size={12} />
                      <span>Manager: {hotel.manager_name}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #262c3a',
          background: '#1a1e27',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <div>Connected to Super Admin Gateway</div>
          <div style={{ color: '#10b981', fontWeight: 700 }}>● Network Live</div>
        </div>
      </div>
    </div>
  );
};
