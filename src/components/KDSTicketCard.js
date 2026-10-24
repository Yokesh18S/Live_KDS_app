import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { formatKitchenTimer, formatTime, getOrderTypeDetails, getCustomerInfo } from '../utils/formatters';

export const KDSTicketCard = memo(function KDSTicketCard({ order, onUpdateStatus }) {
  const [timerInfo, setTimerInfo] = useState(() => formatKitchenTimer(order.created_at));
  const [struckMap, setStruckMap] = useState({});

  const orderStatus = (order.status || 'PENDING').toUpperCase();
  const isLive = orderStatus !== 'SERVED' && orderStatus !== 'READY';

  // Throttle timer updates to every 10 seconds to eliminate 100+ intervals lag
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setTimerInfo(formatKitchenTimer(order.created_at));
    }, 10000);
    return () => clearInterval(timer);
  }, [order.created_at, isLive]);

  const toggleStrike = (idx) => {
    setStruckMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const orderType = getOrderTypeDetails(order);
  const customerInfo = getCustomerInfo(order);

  const isUrgent = timerInfo.urgency === 'critical' && isLive;

  const getTimerColors = () => {
    switch (timerInfo.urgency) {
      case 'critical': return { bg: COLORS.criticalBg, text: COLORS.critical };
      case 'warning': return { bg: COLORS.prepBg, text: COLORS.prep };
      default: return { bg: COLORS.readyBg, text: COLORS.ready };
    }
  };

  const timerColor = getTimerColors();

  // Highlight Bill # prominently (without internal order number)
  const billDisplay = order.bill_no ? `Bill #${order.bill_no}` : `Bill #${order.branch_order_id || order.order_id}`;

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      {/* Header: High-Visibility BILL #, Time, Status & Timer */}
      <View style={styles.cardHeader}>
        <View style={styles.billBox}>
          <Text style={styles.billHeadline}>{billDisplay}</Text>
          <Text style={styles.orderTimeText}>{formatTime(order.created_at)}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Status Badge */}
          {orderStatus === 'PREPARING' && (
            <View style={styles.statusPillPrep}>
              <MaterialCommunityIcons name="pot-steam" size={14} color={COLORS.prep} />
              <Text style={styles.statusPillPrepText}>IN KITCHEN</Text>
            </View>
          )}

          {orderStatus === 'READY' && (
            <View style={styles.statusPillReady}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.ready} />
              <Text style={styles.statusPillReadyText}>READY</Text>
            </View>
          )}

          {/* Bold Live Elapsed Timer */}
          <View style={[styles.timerBadge, { backgroundColor: timerColor.bg }]}>
            <Ionicons name="time" size={14} color={timerColor.text} />
            <Text style={[styles.timerText, { color: timerColor.text }]}>{timerInfo.elapsedStr}</Text>
          </View>
        </View>
      </View>

      {/* Meta Row: Table & Customer Name / Phone Number (or Guest) */}
      <View style={styles.metaRow}>
        <View style={[styles.typeBadge, { backgroundColor: orderType.bg }]}>
          <Text style={[styles.typeText, { color: orderType.color }]}>{orderType.label.toUpperCase()}</Text>
        </View>

        <View style={styles.customerBox}>
          <Ionicons name="person-circle-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.customerText} numberOfLines={1}>
            {customerInfo}
          </Text>
        </View>
      </View>

      {/* Items List with Extra Bold Font & Tap-to-Strike */}
      <View style={styles.itemsList}>
        {(order.items || []).map((item, idx) => {
          const isStruck = !!struckMap[idx];
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.itemRow, isStruck && styles.itemStruck]} 
              onPress={() => toggleStrike(idx)}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.checkbox, isStruck && styles.checkboxActive]}>
                  {isStruck && <Ionicons name="checkmark" size={14} color="#FFF" />}
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
          <Ionicons name="alert-circle" size={14} color="#FBBF24" style={{ marginTop: 2 }} />
          <Text style={styles.notesText}>Note: {order.notes}</Text>
        </View>
      ) : null}

      {/* Single-Touch Instant Action Button */}
      <View style={styles.actionRow}>
        {/* Step 1: PENDING -> Click to Start Prep (Instantly updates to PREPARING and stays) */}
        {orderStatus === 'PENDING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.brand }]}
            onPress={() => onUpdateStatus(order.order_id, 'PREPARING')}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <Text style={styles.actionBtnText}>Accept & Start Prep</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Step 2: PREPARING -> Click Mark Ready (Instantly updates to READY and moves to History) */}
        {orderStatus === 'PREPARING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.ready }]}
            onPress={() => onUpdateStatus(order.order_id, 'READY')}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Mark Ready ✓</Text>
          </TouchableOpacity>
        )}

        {/* In History Tab: READY / SERVED -> Option to Recall back to Kitchen */}
        {(orderStatus === 'READY' || orderStatus === 'SERVED') && (
          <View style={styles.historyRow}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-done" size={16} color={COLORS.ready} />
              <Text style={styles.completedBadgeText}>
                {orderStatus === 'READY' ? 'Food Ready' : 'Completed / Handed Over'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.recallBtn}
              onPress={() => onUpdateStatus(order.order_id, 'PREPARING')}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <Ionicons name="arrow-undo-outline" size={15} color={COLORS.blue} style={{ marginRight: 4 }} />
              <Text style={styles.recallBtnText}>Recall to Kitchen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardUrgent: {
    borderColor: COLORS.critical,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billBox: {
    flex: 1,
  },
  billHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  orderTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPillPrep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.prepBg,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillPrepText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.prep,
    letterSpacing: 0.5,
  },
  statusPillReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.readyBg,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillReadyText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.ready,
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingVertical: 10,
    marginTop: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  customerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemsList: {
    marginVertical: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemStruck: {
    opacity: 0.35,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.ready,
    borderColor: COLORS.ready,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    flex: 1,
    letterSpacing: -0.2,
  },
  itemNameStruck: {
    textDecorationLine: 'line-through',
  },
  qtyBadge: {
    backgroundColor: COLORS.bgCardAccent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
    flex: 1,
  },
  actionRow: {
    marginTop: 6,
  },
  actionBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.readyBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadgeText: {
    color: COLORS.ready,
    fontSize: 12,
    fontWeight: '800',
  },
  recallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recallBtnText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: '800',
  },
});
