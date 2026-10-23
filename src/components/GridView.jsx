import React from 'react';
import { OrderCard } from './OrderCard';

export const GridView = ({ orders, onUpdateStatus, onPrintKOT }) => {
  // Sort orders so critical/pending appear first
  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { PENDING: 0, PREPARING: 1, READY: 2, SERVED: 3 };
    const sa = statusOrder[(a.status || 'PENDING').toUpperCase()] ?? 4;
    const sb = statusOrder[(b.status || 'PENDING').toUpperCase()] ?? 4;
    if (sa !== sb) return sa - sb;
    // Oldest orders first
    return new Date(a.created_at) - new Date(b.created_at);
  });

  if (sortedOrders.length === 0) {
    return (
      <div className="empty-column-state" style={{ height: '350px' }}>
        <span>No active orders matching current filter.</span>
      </div>
    );
  }

  return (
    <div className="grid-matrix-view">
      {sortedOrders.map(order => (
        <OrderCard 
          key={order.order_id} 
          order={order} 
          onUpdateStatus={onUpdateStatus}
          onPrintKOT={onPrintKOT}
        />
      ))}
    </div>
  );
};
