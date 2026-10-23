import React, { useState, useEffect } from 'react';
import { Clock, Printer, Check, CheckCircle2, ChevronRight, User, Phone, CheckSquare, Square } from 'lucide-react';
import { formatKitchenTimer, formatTime, getOrderTypeDetails, getCustomerName } from '../utils/formatters';

export const OrderCard = ({ 
  order, 
  onUpdateStatus, 
  onPrintKOT 
}) => {
  // Live timer state that ticks every second
  const [timerInfo, setTimerInfo] = useState(() => formatKitchenTimer(order.created_at));
  
  // Local item checklist tracking (strike-off as cook finishes items)
  const [struckItems, setStruckItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`kds_struck_${order.order_id}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerInfo(formatKitchenTimer(order.created_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const toggleItemStrike = (itemId) => {
    setStruckItems(prev => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem(`kds_struck_${order.order_id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const orderType = getOrderTypeDetails(order);
  const customerName = getCustomerName(order);
  const orderStatus = (order.status || 'PENDING').toUpperCase();

  const isUrgentCritical = timerInfo.urgency === 'critical' && orderStatus !== 'SERVED';

  return (
    <div className={`kot-card ${isUrgentCritical ? 'card-urgent-critical' : ''}`}>
      {/* Top Header: Order Number, Bill #, and Live Kitchen Timer */}
      <div className="kot-card-header">
        <div className="ticket-id-tag">
          <span className="ticket-number">
            #{order.branch_order_id || order.order_id}
          </span>
          <span className="ticket-bill-no">
            Bill #{order.bill_no || '-'} • {formatTime(order.created_at)}
          </span>
        </div>

        {/* Live Urgency Stopwatch */}
        <div className={`timer-badge timer-${timerInfo.urgency}`}>
          <Clock size={13} />
          <span>{timerInfo.elapsedStr}</span>
        </div>
      </div>

      {/* Meta Row: Table/Takeaway Badge, Waiter Attribution */}
      <div className="ticket-meta-row">
        <span className={`table-badge ${orderType.badgeClass}`}>
          {orderType.label}
        </span>
        <span className="placed-by-text">
          {order.placed_by_name ? `Waiter: ${order.placed_by_name}` : customerName}
        </span>
      </div>

      {/* Items Checklist with Interactive Strike-through */}
      <div className="ticket-items-list">
        {(order.items || []).map((item, idx) => {
          const isStruck = !!struckItems[item.id || idx];
          return (
            <div 
              key={item.id || idx} 
              className={`ticket-item ${isStruck ? 'struck' : ''}`}
              onClick={() => toggleItemStrike(item.id || idx)}
              title="Click to strike-off item when prepared"
            >
              <div className="item-left">
                <div className="item-checkbox">
                  {isStruck ? <Check size={12} strokeWidth={3} /> : null}
                </div>
                <span className="item-name">{item.name}</span>
              </div>
              <span className="item-qty-badge">x {item.quantity}</span>
            </div>
          );
        })}
      </div>

      {/* Special Customer Notes (if any) */}
      {order.notes && (
        <div style={{
          fontSize: '0.75rem',
          color: '#fbbf24',
          background: 'rgba(251, 191, 36, 0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontStyle: 'italic'
        }}>
          Note: {order.notes}
        </div>
      )}

      {/* Action Buttons: Swiggy/Zomato Progression */}
      <div className="ticket-action-bar">
        {orderStatus === 'PENDING' && (
          <button 
            className="btn-primary-action btn-accept"
            onClick={() => onUpdateStatus(order.order_id, 'PREPARING')}
          >
            <span>Accept & Start Prep</span>
            <ChevronRight size={16} />
          </button>
        )}

        {orderStatus === 'PREPARING' && (
          <button 
            className="btn-primary-action btn-ready"
            onClick={() => onUpdateStatus(order.order_id, 'READY')}
          >
            <CheckCircle2 size={16} />
            <span>Mark Food Ready</span>
          </button>
        )}

        {orderStatus === 'READY' && (
          <button 
            className="btn-primary-action btn-dispatch"
            onClick={() => onUpdateStatus(order.order_id, 'SERVED')}
          >
            <span>Dispatch / Handover</span>
            <Check size={16} />
          </button>
        )}

        {orderStatus === 'SERVED' && (
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            padding: '10px 0'
          }}>
            Completed ✓
          </div>
        )}

        {/* Print KOT Button */}
        <button 
          className="btn-print" 
          title="Print KOT Thermal Slip"
          onClick={() => onPrintKOT(order)}
        >
          <Printer size={18} />
        </button>
      </div>
    </div>
  );
};
