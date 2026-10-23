import React, { useState, useEffect } from 'react';
import { ChefHat, Bell, BellOff, Volume2, Maximize, Minimize, History, LayoutGrid, Columns, RefreshCw, User } from 'lucide-react';
import { kdsAudio } from '../utils/kotAudio';

export const Header = ({ 
  viewMode, 
  setViewMode, 
  onRefresh, 
  isRefreshing, 
  completedCount, 
  onOpenRecall, 
  onOpenLogin,
  currentUser 
}) => {
  const [audioState, setAudioState] = useState({ isRinging: false, isMuted: false, isUnlocked: false });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsub = kdsAudio.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const toggleAudioMute = () => {
    kdsAudio.setMuted(!audioState.isMuted);
  };

  const testAudioBell = () => {
    kdsAudio.unlock();
    kdsAudio.playSingleChime();
  };

  return (
    <header className="kds-header">
      <div className="kds-brand">
        <div className="brand-icon">
          <ChefHat size={24} />
        </div>
        <div className="brand-titles">
          <h1>LIVE KDS</h1>
          <span>Kitchen Display System</span>
        </div>
        <div className="header-status-badge">
          <div className="live-pulse-dot" />
          <span>KITCHEN LIVE</span>
        </div>
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
            title={audioState.isMuted ? "Unmute Kitchen Audio" : "Kitchen Audio Active (Click to test/mute)"}
            onClick={toggleAudioMute}
          >
            {audioState.isMuted ? <BellOff size={19} color="#ef4444" /> : <Volume2 size={19} color="#10b981" />}
          </button>
        )}

        {/* View Switcher (Kanban vs Grid) - Desktop & Tablet */}
        <button 
          className="icon-btn" 
          title={viewMode === 'kanban' ? "Switch to Grid Matrix View" : "Switch to Kanban Columns"}
          onClick={() => setViewMode(viewMode === 'kanban' ? 'grid' : 'kanban')}
        >
          {viewMode === 'kanban' ? <LayoutGrid size={19} /> : <Columns size={19} />}
        </button>

        {/* Recall History Drawer Button */}
        <button 
          className="icon-btn" 
          title="Recently Bumped / Completed Orders"
          onClick={onOpenRecall}
          style={{ position: 'relative' }}
        >
          <History size={19} />
          {completedCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {completedCount}
            </span>
          )}
        </button>

        {/* Manual Refresh Button */}
        <button 
          className={`icon-btn ${isRefreshing ? 'spin-refresh' : ''}`} 
          title="Refresh Active Orders"
          onClick={onRefresh}
        >
          <RefreshCw size={18} />
        </button>

        {/* Fullscreen Kiosk Mode Button */}
        <button 
          className="icon-btn" 
          title="Toggle Fullscreen Kiosk Mode"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
        </button>

        {/* Staff / Manager Login */}
        <button 
          className="icon-btn" 
          title={currentUser ? `Logged in: ${currentUser.name || currentUser.role}` : "Kitchen Staff Login"}
          onClick={onOpenLogin}
        >
          <User size={19} color={currentUser ? "#10b981" : "inherit"} />
        </button>
      </div>
    </header>
  );
};
