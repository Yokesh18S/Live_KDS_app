import React from 'react';
import { X, RotateCcw, Clock, Utensils } from 'lucide-react';
import { formatTime, getOrderTypeDetails } from '../utils/formatters';

export const RecallDrawer = ({ 
  isOpen, 
  onClose, 
  completedOrders, 
  onRecallOrder 
}) => {
  if (!isOpen) return null;

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
      justifyContent: 'flex-end',
      animation: 'fade-in 0.2s'
    }}>
      <div style={{
        background: '#14171f',
        borderLeft: '1px solid #262c3a',
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.6)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #262c3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recently Bumped Orders</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Restore accidentally bumped tickets back to active kitchen
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', color: '#94a3b8' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Completed Tickets List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {completedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '0.9rem' }}>
              No completed orders in current session.
            </div>
          ) : (
            completedOrders.map((order) => {
              const orderType = getOrderTypeDetails(order);
              return (
                <div 
                  key={order.order_id} 
                  style={{
                    background: '#1a1e27',
                    border: '1px solid #262c3a',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                      #{order.branch_order_id || order.order_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatTime(order.created_at)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`table-badge ${orderType.badgeClass}`}>
                      {orderType.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {(order.items || []).length} items
                    </span>
                  </div>

                  {/* Item Summary */}
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  {/* Recall Button */}
                  <button 
                    onClick={() => onRecallOrder(order.order_id)}
                    style={{
                      marginTop: '6px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      height: '36px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Recall Order to Ready Screen</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
