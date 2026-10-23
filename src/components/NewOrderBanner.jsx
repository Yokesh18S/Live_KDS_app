import React from 'react';
import { Bell, CheckCircle, VolumeX } from 'lucide-react';
import { kdsAudio } from '../utils/kotAudio';
import { getOrderTypeDetails } from '../utils/formatters';

export const NewOrderBanner = ({ newOrders, onAcceptAll, onAcceptSingle }) => {
  if (!newOrders || newOrders.length === 0) return null;

  const firstOrder = newOrders[0];
  const orderType = getOrderTypeDetails(firstOrder);
  const totalCount = newOrders.length;

  return (
    <div className="new-order-alert-bar">
      <div className="new-order-alert-info">
        <div className="alert-ring-icon">
          <Bell size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            {totalCount === 1 ? '🚨 NEW ORDER RECEIVED!' : `🚨 ${totalCount} NEW ORDERS AWAITING ACCEPTANCE!`}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            Order #{firstOrder.branch_order_id || firstOrder.order_id} • {orderType.label} • {firstOrder.items?.length || 0} Items
          </div>
        </div>
      </div>

      <div className="alert-btn-group">
        <button 
          className="alert-btn-mute" 
          onClick={() => kdsAudio.stopContinuousAlert()}
          title="Silence Chime"
        >
          <VolumeX size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Mute Chime
        </button>

        <button 
          className="alert-btn-accept" 
          onClick={() => {
            kdsAudio.stopContinuousAlert();
            if (totalCount === 1) {
              onAcceptSingle(firstOrder.order_id);
            } else {
              onAcceptAll();
            }
          }}
        >
          <CheckCircle size={17} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          {totalCount === 1 ? 'Accept & Start Prep' : `Accept All (${totalCount})`}
        </button>
      </div>
    </div>
  );
};
