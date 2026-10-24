import React, { useState, useEffect } from 'react';
import { ChefHat, Bell, BellOff, Volume2, History, LayoutGrid, Columns, RefreshCw, User, Store, ChevronDown } from 'lucide-react';
import { kdsAudio } from '../utils/kotAudio';

export const Header = ({ 
  viewMode, 
  setViewMode, 
  selectedRestaurant,
  onOpenHotelSelector,
  onRefresh, 
  isRefreshing, 
  completedCount, 
  onOpenRecall, 
  onOpenLogin,
  currentUser 
}) => {
  const [audioState, setAudioState] = useState({ isRinging: false, isMuted: false, isUnlocked: false });

  useEffect(() => {
    const unsub = kdsAudio.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  const toggleAudioMute = () => {
    kdsAudio.setMuted(!audioState.isMuted);
  };

  return (
    <header className="kds-header">
      <div className="kds-brand">
        <div className="brand-icon">
          <ChefHat size={22} />
        </div>
        <div className="brand-titles">
          <h1>LIVE KDS</h1>
          <span>KITCHEN MONITOR</span>
        </div>

        {/* Selected Hotel Pill */}
        {selectedRestaurant && (
          <button 
            onClick={onOpenHotelSelector}
            title="Click to Switch Hotel Branch"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1a1e27',
              border: '1px solid rgba(252, 128, 25, 0.4)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#fff',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            <Store size={15} color="#fc8019" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedRestaurant.name}
            </span>
            <span style={{
              background: 'rgba(252, 128, 25, 0.2)',
              color: '#fc8019',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <span>Switch</span>
              <ChevronDown size={11} />
            </span>
          </button>
        )}
      </div>

      <div className="header-actions">
        {/* Siren Alert / Audio Toggle Button */}
        {audioState.isRinging ? (
          <button 
            className="icon-btn active-siren" 
            title="Alarm Ringing! Click to Stop Siren"
            onClick={() => kdsAudio.stopContinuousAlert()}
          >
            <Bell size={20} />
          </button>
        ) : (
          <button 
            className="icon-btn" 
            title={audioState.isMuted ? "Unmute Kitchen Audio" : "Kitchen Audio Active"}
            onClick={toggleAudioMute}
          >
            {audioState.isMuted ? <BellOff size={18} color="#ef4444" /> : <Volume2 size={18} color="#10b981" />}
          </button>
        )}

        {/* View Switcher (Kanban vs Grid) */}
        <button 
          className="icon-btn" 
          title={viewMode === 'kanban' ? "Switch to Grid Matrix View" : "Switch to Kanban Columns"}
          onClick={() => setViewMode(viewMode === 'kanban' ? 'grid' : 'kanban')}
        >
          {viewMode === 'kanban' ? <LayoutGrid size={18} /> : <Columns size={18} />}
        </button>

        {/* Recall History Drawer Button */}
        <button 
          className="icon-btn" 
          title="Recently Bumped / Completed Orders"
          onClick={onOpenRecall}
          style={{ position: 'relative' }}
        >
          <History size={18} />
          {completedCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {completedCount}
            </span>
          )}
        </button>

        {/* Refresh Button */}
        <button 
          className="icon-btn" 
          title="Refresh Live Orders"
          onClick={() => onRefresh(false)}
        >
          <RefreshCw size={18} className={isRefreshing ? "spin" : ""} />
        </button>

        {/* Super Admin Login / Profile Button */}
        <button 
          className="icon-btn" 
          title={currentUser ? "Super Admin Account" : "Sign In as Super Admin"}
          onClick={onOpenLogin}
          style={{
            borderColor: currentUser ? 'rgba(252, 128, 25, 0.4)' : undefined
          }}
        >
          <User size={18} color={currentUser ? "#fc8019" : undefined} />
        </button>
      </div>
    </header>
  );
};
