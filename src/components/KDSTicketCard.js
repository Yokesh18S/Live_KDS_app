import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { formatKitchenTimer, formatTime, getOrderTypeDetails, getCustomerName } from '../utils/formatters';

export function KDSTicketCard({ order, onUpdateStatus }) {
  const [timerInfo, setTimerInfo] = useState(() => formatKitchenTimer(order.created_at));
  const [struckMap, setStruckMap] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerInfo(formatKitchenTimer(order.created_at));
    }, 1000);
    return () => clearInterval(timer);
  }, [order.created_at]);

  const toggleStrike = (idx) => {
    setStruckMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const orderType = getOrderTypeDetails(order);
  const customerName = getCustomerName(order);
  const orderStatus = (order.status || 'PENDING').toUpperCase();

  const isUrgent = timerInfo.urgency === 'critical' && orderStatus !== 'SERVED';

  const getTimerColors = () => {
    switch (timerInfo.urgency) {
      case 'critical': return { bg: COLORS.criticalBg, text: COLORS.critical };
      case 'warning': return { bg: COLORS.prepBg, text: COLORS.prep };
      default: return { bg: COLORS.readyBg, text: COLORS.ready };
    }
  };

  const timerColor = getTimerColors();

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      {/* Header: Order #, Bill #, Live Timer */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>#{order.branch_order_id || order.order_id}</Text>
          <Text style={styles.billNumber}>Bill #{order.bill_no || '-'} • {formatTime(order.created_at)}</Text>
        </View>

        <View style={[styles.timerBadge, { backgroundColor: timerColor.bg }]}>
          <Ionicons name="time-outline" size={13} color={timerColor.text} />
          <Text style={[styles.timerText, { color: timerColor.text }]}>{timerInfo.elapsedStr}</Text>
        </View>
      </View>

      {/* Meta Row: Table & Waiter / Customer */}
      <View style={styles.metaRow}>
        <View style={[styles.typeBadge, { backgroundColor: orderType.bg }]}>
          <Text style={[styles.typeText, { color: orderType.color }]}>{orderType.label}</Text>
        </View>
        <Text style={styles.serverText}>
          {order.placed_by_name ? `Waiter: ${order.placed_by_name}` : customerName}
        </Text>
      </View>

      {/* Items List with Tap-to-Strike */}
      <View style={styles.itemsList}>
        {(order.items || []).map((item, idx) => {
          const isStruck = !!struckMap[idx];
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.itemRow, isStruck && styles.itemStruck]} 
              onPress={() => toggleStrike(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.checkbox, isStruck && styles.checkboxActive]}>
                  {isStruck && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={[styles.itemName, isStruck && styles.itemNameStruck]}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>x{item.quantity}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Special Notes (if any) */}
      {order.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>Note: {order.notes}</Text>
        </View>
      ) : null}

      {/* Action Progression Button */}
      <View style={styles.actionRow}>
        {orderStatus === 'PENDING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.brand }]}
            onPress={() => onUpdateStatus(order.order_id, 'PREPARING')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Accept & Start Prep</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        )}

        {orderStatus === 'PREPARING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.ready }]}
            onPress={() => onUpdateStatus(order.order_id, 'READY')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Mark Food Ready</Text>
          </TouchableOpacity>
        )}

        {orderStatus === 'READY' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.blue }]}
            onPress={() => onUpdateStatus(order.order_id, 'SERVED')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Dispatch / Handover</Text>
          </TouchableOpacity>
        )}

        {orderStatus === 'SERVED' && (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>Completed ✓</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 14,
    marginBottom: 12,
  },
  cardUrgent: {
    borderColor: COLORS.critical,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  billNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingVertical: 8,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  serverText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  itemsList: {
    marginVertical: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  itemStruck: {
    opacity: 0.4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.ready,
    borderColor: COLORS.ready,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  itemNameStruck: {
    textDecorationLine: 'line-through',
  },
  qtyBadge: {
    backgroundColor: COLORS.bgCardAccent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  notesBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#FBBF24',
    fontStyle: 'italic',
  },
  actionRow: {
    marginTop: 4,
  },
  actionBtn: {
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  completedBox: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  completedText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
