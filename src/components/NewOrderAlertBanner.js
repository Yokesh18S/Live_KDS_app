import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getOrderTypeDetails } from '../utils/formatters';

export function NewOrderAlertBanner({ newOrders, onAcceptAll, onMute }) {
  if (!newOrders || newOrders.length === 0) return null;

  const firstOrder = newOrders[0];
  const orderType = getOrderTypeDetails(firstOrder);
  const count = newOrders.length;
  const billLabel = firstOrder.bill_no ? `Bill #${firstOrder.bill_no}` : `Bill #${firstOrder.branch_order_id || firstOrder.order_id}`;

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <View style={styles.alertIcon}>
          <Ionicons name="notifications" size={22} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {count === 1 ? '🚨 NEW ORDER RECEIVED!' : `🚨 ${count} NEW ORDERS AWAITING!`}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {billLabel} • {orderType.label} • {firstOrder.items?.length || 0} Items
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.muteBtn} onPress={onMute} activeOpacity={0.7}>
          <Text style={styles.muteText}>Mute</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.acceptBtn} onPress={onAcceptAll} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={17} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.acceptText}>{count === 1 ? 'Accept' : `Accept All (${count})`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#C2410C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  muteText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  acceptBtn: {
    backgroundColor: COLORS.ready,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
