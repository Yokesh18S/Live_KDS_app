import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export function KDSHeader({ 
  selectedRestaurant,
  onOpenHotelSelector,
  onRefresh, 
  isRefreshing, 
  isRinging, 
  onStopSiren, 
  onTestSound,
  onOpenServerConfig,
  onLogout,
  sortOrder = 'FILO',
  onToggleSortOrder,
}) {
  return (
    <View style={styles.headerContainer}>
      {/* Top Row: Brand & System Action Buttons */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialCommunityIcons name="chef-hat" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>LIVE KDS</Text>
            <Text style={styles.brandSubtitle}>KITCHEN DISPLAY</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Mute Siren Button (Visible when ringing) */}
          {isRinging ? (
            <TouchableOpacity style={styles.sirenButton} onPress={onStopSiren} activeOpacity={0.7}>
              <Ionicons name="notifications" size={16} color="#FFF" />
              <Text style={styles.sirenText}>MUTE</Text>
            </TouchableOpacity>
          ) : (
            /* Test Audio Button (Allows checking loud noise anytime) */
            <TouchableOpacity 
              style={[styles.iconBtn, { borderColor: 'rgba(252, 128, 25, 0.4)' }]} 
              onPress={onTestSound} 
              activeOpacity={0.7} 
              title="Test Loud Sound"
            >
              <Ionicons name="volume-high-outline" size={18} color={COLORS.brand} />
            </TouchableOpacity>
          )}

          {/* Refresh Button */}
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} activeOpacity={0.7} title="Refresh">
            <Ionicons name={isRefreshing ? "sync" : "refresh"} size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Server Config Button */}
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenServerConfig} activeOpacity={0.7} title="Server Config">
            <Ionicons name="server-outline" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Logout Button */}
          {onLogout && (
            <TouchableOpacity 
              style={[styles.iconBtn, { borderColor: 'rgba(239, 68, 68, 0.35)' }]} 
              onPress={onLogout} 
              activeOpacity={0.7}
              title="Logout"
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.critical} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sub Row: Full-width Hotel Selector & Sort Order (Completely fixes overlapping) */}
      <View style={styles.subRow}>
        {selectedRestaurant && (
          <TouchableOpacity 
            style={styles.hotelPill} 
            onPress={onOpenHotelSelector}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="storefront-outline" size={16} color={COLORS.brand} />
            <Text style={styles.hotelName} numberOfLines={1}>
              {selectedRestaurant.name}
            </Text>
            <View style={styles.switchBadge}>
              <Text style={styles.switchBadgeText}>Switch</Text>
              <Ionicons name="chevron-down" size={11} color={COLORS.brand} />
            </View>
          </TouchableOpacity>
        )}

        {onToggleSortOrder && (
          <TouchableOpacity 
            style={styles.sortPill}
            onPress={onToggleSortOrder}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={13} color={COLORS.brand} />
            <Text style={styles.sortPillText}>
              {sortOrder === 'FILO' ? 'FILO (Newest)' : 'FIFO (Oldest)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  topRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginLeft: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.ready,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.ready,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sirenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.critical,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sirenText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 2,
    gap: 8,
  },
  hotelPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(252, 128, 25, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hotelName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  switchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(252, 128, 25, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  switchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
