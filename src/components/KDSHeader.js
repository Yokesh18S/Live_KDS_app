import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export function KDSHeader({ 
  onRefresh, 
  isRefreshing, 
  isRinging, 
  onStopSiren, 
  onOpenServerConfig,
  onOpenRecall,
  completedCount 
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <MaterialCommunityIcons name="chef-hat" size={24} color="#FFF" />
        </View>
        <View>
          <Text style={styles.brandTitle}>LIVE KDS</Text>
          <Text style={styles.brandSubtitle}>EXPO KITCHEN DISPLAY</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {/* Ringing Siren Button */}
        {isRinging && (
          <TouchableOpacity style={styles.sirenButton} onPress={onStopSiren} activeOpacity={0.7}>
            <Ionicons name="notifications" size={20} color="#FFF" />
            <Text style={styles.sirenText}>MUTE</Text>
          </TouchableOpacity>
        )}

        {/* Server Config Button */}
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenServerConfig} activeOpacity={0.7}>
          <Ionicons name="server-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* History / Recall Button */}
        <TouchableOpacity style={styles.iconBtn} onPress={onOpenRecall} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={20} color={COLORS.textPrimary} />
          {completedCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{completedCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Ionicons name={isRefreshing ? "sync" : "refresh"} size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginLeft: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ready,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ready,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '800',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
