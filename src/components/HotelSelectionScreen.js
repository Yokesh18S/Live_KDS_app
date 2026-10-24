import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { kdsApi } from '../services/api';

export function HotelSelectionScreen({ 
  onSelectHotel, 
  selectedHotelId, 
  canCancel = false, 
  onClose, 
  onLogout 
}) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHotels = async () => {
    setErrorMsg('');
    try {
      const data = await kdsApi.getRestaurants();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels([]);
      }
    } catch (err) {
      console.warn('[Hotels Fetch Error]:', err.message);
      setErrorMsg(err.message || 'Failed to load connected hotels. Check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHotels();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {canCancel && (
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Connected Hotels</Text>
            <Text style={styles.headerSubtitle}>Select a hotel to view live KOT & KDS orders</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          {onLogout && (
            <TouchableOpacity onPress={onLogout} style={[styles.iconBtn, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.critical} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.loadingText}>Fetching connected hotels & branches...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.critical} />
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchHotels}>
            <Ionicons name="reload" size={16} color="#FFF" />
            <Text style={styles.retryText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : hotels.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="store-off-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Hotels Found</Text>
          <Text style={styles.emptySub}>No connected restaurant branches are available on this server.</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
        >
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              FOUND <Text style={{ color: COLORS.brand, fontWeight: '800' }}>{hotels.length}</Text> CONNECTED HOTELS
            </Text>
            <View style={styles.liveIndicator}>
              <View style={styles.greenDot} />
              <Text style={styles.liveIndicatorText}>LIVE NETWORK</Text>
            </View>
          </View>

          {hotels.map((hotel) => {
            const isSelected = selectedHotelId === hotel.id;
            return (
              <TouchableOpacity
                key={hotel.id}
                style={[styles.hotelCard, isSelected && styles.hotelCardSelected]}
                onPress={() => onSelectHotel(hotel)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.hotelIconBox}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={COLORS.brand} />
                  </View>
                  <View style={styles.hotelMeta}>
                    <View style={styles.titleRow}>
                      <Text style={styles.hotelName}>{hotel.name}</Text>
                      {isSelected && (
                        <View style={styles.activePill}>
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.ready} />
                          <Text style={styles.activePillText}>CURRENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.hotelBranchId}>Branch #{hotel.id}</Text>
                  </View>
                </View>

                {hotel.address ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.addressText} numberOfLines={2}>{hotel.address}</Text>
                  </View>
                ) : null}

                {hotel.manager_name ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.managerText}>Manager: {hotel.manager_name}</Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.badgeGroup}>
                    <View style={styles.statusPill}>
                      <View style={styles.greenDot} />
                      <Text style={styles.statusText}>Connected</Text>
                    </View>
                    {typeof hotel.orders === 'number' && (
                      <View style={styles.ordersBadge}>
                        <Text style={styles.ordersBadgeText}>{hotel.orders} Orders Total</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.openBtn}>
                    <Text style={styles.openBtnText}>Open KOT / KDS</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.brand} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Super Admin Info Bar */}
      <View style={styles.footerBar}>
        <View style={styles.adminInfo}>
          <MaterialCommunityIcons name="shield-check" size={18} color={COLORS.brand} />
          <Text style={styles.adminInfoText}>Logged in as <Text style={{ color: '#FFF', fontWeight: '700' }}>Super Admin</Text></Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.critical,
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  listContent: {
    padding: 16,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ready,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ready,
  },
  hotelCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  hotelCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(252, 128, 25, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  hotelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.ready,
  },
  hotelBranchId: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  managerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ready,
  },
  ordersBadge: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  ordersBadgeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  footerBar: {
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
