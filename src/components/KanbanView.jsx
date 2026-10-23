import React from 'react';
import { OrderCard } from './OrderCard';
import { Clock, ChefHat, CheckCircle2, Check } from 'lucide-react';

export const KanbanView = ({ 
  orders, 
  onUpdateStatus, 
  onPrintKOT 
}) => {
  const pendingOrders = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
  const preparingOrders = orders.filter(o => (o.status || '').toUpperCase() === 'PREPARING');
  const readyOrders = orders.filter(o => (o.status || '').toUpperCase() === 'READY');
  const servedOrders = orders.filter(o => (o.status || '').toUpperCase() === 'SERVED');

  const columns = [
    {
      id: 'PENDING',
      title: 'New Orders',
      icon: Clock,
      className: 'col-new',
      orders: pendingOrders,
      emptyText: 'No incoming pending orders'
    },
    {
      id: 'PREPARING',
      title: 'In Kitchen (Prep)',
      icon: ChefHat,
      className: 'col-prep',
      orders: preparingOrders,
      emptyText: 'No orders currently cooking'
    },
    {
      id: 'READY',
      title: 'Ready for Pickup',
      icon: CheckCircle2,
      className: 'col-ready',
      orders: readyOrders,
      emptyText: 'No orders waiting for handover'
    },
    {
      id: 'SERVED',
      title: 'Recent Served',
      icon: Check,
      className: 'col-served',
      orders: servedOrders.slice(0, 10),
      emptyText: 'No recently served orders'
    }
  ];

  return (
    <div className="kanban-board">
      {columns.map(col => {
        const IconComponent = col.icon;
        return (
          <div key={col.id} className={`kanban-column ${col.className}`}>
            <div className="column-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconComponent size={18} />
                <span>{col.title}</span>
              </div>
              <span className="col-badge">{col.orders.length}</span>
            </div>

            <div className="column-tickets">
              {col.orders.length === 0 ? (
                <div className="empty-column-state">
                  <IconComponent size={28} opacity={0.3} />
                  <span>{col.emptyText}</span>
                </div>
              ) : (
                col.orders.map(order => (
                  <OrderCard 
                    key={order.order_id} 
                    order={order} 
                    onUpdateStatus={onUpdateStatus}
                    onPrintKOT={onPrintKOT}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
