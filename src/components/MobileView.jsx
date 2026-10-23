import React, { useState } from 'react';
import { OrderCard } from './OrderCard';
import { Clock, ChefHat, CheckCircle2, History } from 'lucide-react';

export const MobileView = ({ 
  orders, 
  onUpdateStatus, 
  onPrintKOT, 
  onOpenRecall 
}) => {
  const [activeTab, setActiveTab] = useState('PENDING');

  const pending = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
  const preparing = orders.filter(o => (o.status || '').toUpperCase() === 'PREPARING');
  const ready = orders.filter(o => (o.status || '').toUpperCase() === 'READY');

  const getActiveList = () => {
    switch (activeTab) {
      case 'PENDING': return pending;
      case 'PREPARING': return preparing;
      case 'READY': return ready;
      default: return pending;
    }
  };

  const activeOrders = getActiveList();

  return (
    <div className="mobile-active-view">
      {/* Top Segmented Tab Switcher for Quick Finger Tap */}
      <div style={{
        display: 'flex',
        background: '#14171f',
        borderRadius: '10px',
        padding: '4px',
        border: '1px solid #262c3a',
        gap: '4px'
      }}>
        <button 
          onClick={() => setActiveTab('PENDING')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: activeTab === 'PENDING' ? 'var(--color-pending)' : 'transparent',
            color: activeTab === 'PENDING' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          New ({pending.length})
        </button>

        <button 
          onClick={() => setActiveTab('PREPARING')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: activeTab === 'PREPARING' ? 'var(--color-prep)' : 'transparent',
            color: activeTab === 'PREPARING' ? '#000' : 'var(--text-secondary)'
          }}
        >
          Cooking ({preparing.length})
        </button>

        <button 
          onClick={() => setActiveTab('READY')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: activeTab === 'READY' ? 'var(--color-ready)' : 'transparent',
            color: activeTab === 'READY' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          Ready ({ready.length})
        </button>
      </div>

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {activeOrders.length === 0 ? (
          <div className="empty-column-state" style={{ height: '240px' }}>
            <span>No orders in this stage.</span>
          </div>
        ) : (
          activeOrders.map(order => (
            <OrderCard 
              key={order.order_id} 
              order={order} 
              onUpdateStatus={onUpdateStatus}
              onPrintKOT={onPrintKOT}
            />
          ))
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          <Clock size={18} />
          <span>New Orders</span>
          {pending.length > 0 && <span className="mobile-nav-badge">{pending.length}</span>}
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'PREPARING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PREPARING')}
        >
          <ChefHat size={18} />
          <span>Cooking</span>
          {preparing.length > 0 && (
            <span className="mobile-nav-badge" style={{ background: '#eab308', color: '#000' }}>
              {preparing.length}
            </span>
          )}
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'READY' ? 'active' : ''}`}
          onClick={() => setActiveTab('READY')}
        >
          <CheckCircle2 size={18} />
          <span>Ready</span>
          {ready.length > 0 && (
            <span className="mobile-nav-badge" style={{ background: '#10b981' }}>
              {ready.length}
            </span>
          )}
        </button>

        <button 
          className="mobile-nav-item"
          onClick={onOpenRecall}
        >
          <History size={18} />
          <span>History</span>
        </button>
      </nav>
    </div>
  );
};
