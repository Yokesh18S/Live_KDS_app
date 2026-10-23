import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatTime, getOrderTypeDetails } from '../utils/formatters';

export const PrintKOTModal = ({ order, onClose }) => {
  if (!order) return null;

  const orderType = getOrderTypeDetails(order);
  const restName = import.meta.env.VITE_RESTAURANT_NAME || 'DATA UDIPI RESTAURANT';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        background: '#1a1e27',
        border: '1px solid #374151',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #262c3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Printer size={18} color="#fc8019" />
            <span>KOT Thermal Print Preview</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Thermal Slip Preview Window */}
        <div style={{ padding: '20px', background: '#0f1115', display: 'flex', justifyContent: 'center' }}>
          <div className="thermal-kot-receipt" style={{
            background: '#fff',
            color: '#000',
            padding: '14px',
            width: '100%',
            maxWidth: '300px',
            fontFamily: 'monospace',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            <div className="receipt-header" style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>{restName}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>** KITCHEN ORDER TICKET **</div>
            </div>

            <div style={{ fontSize: '12px', margin: '8px 0', lineHeight: '1.4' }}>
              <div><b>ORDER #:</b> #{order.branch_order_id || order.order_id}</div>
              <div><b>BILL NO:</b> {order.bill_no || '-'}</div>
              <div><b>TYPE:</b> {orderType.label.toUpperCase()}</div>
              <div><b>TIME:</b> {formatTime(order.created_at)}</div>
              {order.placed_by_name && <div><b>SERVER:</b> {order.placed_by_name}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 0', fontSize: '12px' }}>ITEM</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', fontSize: '12px' }}>QTY</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0', fontWeight: 'bold', fontSize: '13px' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 'bold', fontSize: '14px' }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {order.notes && (
              <div style={{ fontSize: '11px', margin: '6px 0', fontWeight: 'bold' }}>
                SPECIAL: {order.notes}
              </div>
            )}

            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '6px', fontSize: '11px' }}>
              Thank You! Kitchen Copy
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #262c3a', display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              height: '40px',
              background: '#222733',
              color: '#94a3b8',
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handlePrint}
            style={{
              flex: 2,
              height: '40px',
              background: '#fc8019',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} />
            <span>Print KOT Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
