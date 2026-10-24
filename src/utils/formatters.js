export function formatKitchenTimer(dateString) {
  if (!dateString) return { elapsedStr: '00:00', minutes: 0, seconds: 0, urgency: 'fresh' };

  let dStr = typeof dateString === 'string' ? dateString : dateString.toString();
  if (!dStr.includes('Z') && !dStr.includes('+')) {
    dStr = dStr.replace(' ', 'T') + 'Z';
  }
  const orderTime = new Date(dStr);
  const validTime = isNaN(orderTime.getTime()) ? new Date(dateString) : orderTime;
  if (isNaN(validTime.getTime())) {
    return { elapsedStr: '00:00', minutes: 0, seconds: 0, urgency: 'fresh' };
  }

  const now = new Date();
  const diffMs = Math.max(0, now - validTime);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const elapsedStr = `${mm}:${ss}`;

  let urgency = 'fresh';
  if (minutes >= 20) {
    urgency = 'critical';
  } else if (minutes >= 10) {
    urgency = 'warning';
  }

  return { elapsedStr, minutes, seconds, urgency };
}

export function formatTime(dateString) {
  if (!dateString) return '';
  let dStr = typeof dateString === 'string' ? dateString : dateString.toString();
  if (!dStr.includes('Z') && !dStr.includes('+')) {
    dStr = dStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(dStr);
  const validDate = isNaN(d.getTime()) ? new Date(dateString) : d;
  if (isNaN(validDate.getTime())) return '';
  return validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getOrderTypeDetails(order) {
  const typeStr = (order.order_type || '').toUpperCase();
  const table = (order.table_number || '').toString().trim().toUpperCase();

  const isDelivery = typeStr === 'DELIVERY' || order.delivery_address;
  const isTakeaway = !isDelivery && (typeStr === 'TAKEAWAY' || table === 'TAKEAWAY' || table === 'N/A' || !table);

  if (isDelivery) {
    return {
      type: 'DELIVERY',
      label: 'Delivery 🛵',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
    };
  }

  if (isTakeaway) {
    return {
      type: 'TAKEAWAY',
      label: 'Takeaway 🛍️',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.15)',
    };
  }

  const cleanTable = table ? (table.startsWith('T-') ? table : `Table ${table}`) : 'Table -';
  return {
    type: 'DINE_IN',
    label: cleanTable,
    color: '#FC8019',
    bg: 'rgba(252, 128, 25, 0.15)',
  };
}

/**
 * Customer details resolution:
 * - If name and phone given: "Name • Phone"
 * - If only name given: "Name"
 * - If only phone given: "Phone"
 * - If neither given: "Guest"
 */
export function getCustomerInfo(order) {
  let name = (order.customer_name || '').trim();
  let phone = (order.customer_phone || '').trim();

  if (order.delivery_address) {
    try {
      const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
      if (addr && (addr.contact_name || addr.name)) {
        name = addr.contact_name || addr.name;
      }
      if (addr && (addr.contact_phone || addr.phone) && !phone) {
        phone = addr.contact_phone || addr.phone;
      }
    } catch (e) {}
  }

  // Treat generic names as missing
  const isGeneric = !name || name.toLowerCase() === 'guest' || name === phone;

  if (!isGeneric && phone) {
    return `${name} • ${phone}`;
  } else if (!isGeneric) {
    return name;
  } else if (phone) {
    return phone;
  } else {
    return 'Guest';
  }
}

export const getCustomerName = getCustomerInfo;
