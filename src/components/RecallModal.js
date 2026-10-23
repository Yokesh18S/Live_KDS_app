import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getOrderTypeDetails, formatTime } from '../utils/formatters';

export function RecallModal({ visible, onClose, completedOrders, onRecall }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Recently Completed Orders</Text>
              <Text style={styles.subtitle}>Restore accidentally bumped tickets back to Ready</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {completedOrders.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No completed orders in this session.</Text>
              </View>
            ) : (
              completedOrders.map(order => {
                const orderType = getOrderTypeDetails(order);
                return (
                  <View key={order.order_id} style={styles.itemCard}>
                    <View style={styles.row}>
                      <Text style={styles.orderId}>#{order.branch_order_id || order.order_id}</Text>
                      <Text style={styles.time}>{formatTime(order.created_at)}</Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={[styles.type, { color: orderType.color }]}>{orderType.label}</Text>
                      <Text style={styles.itemCount}>{(order.items || []).length} items</Text>
                    </View>

                    <Text style={styles.itemSummary} numberOfLines={2}>
                      {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </Text>

                    <TouchableOpacity 
                      style={styles.recallBtn}
                      onPress={() => onRecall(order.order_id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-undo-outline" size={14} color={COLORS.blue} style={{ marginRight: 4 }} />
                      <Text style={styles.recallBtnText}>Recall Order</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '75%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scroll: {
    marginTop: 8,
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  itemSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  recallBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 6,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  recallBtnText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
  },
});
