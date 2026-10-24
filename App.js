import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Vibration, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';
import { initAudioMode, playLoudAlarmSound, stopLoudAlarmSound } from './src/utils/expoSound';
import { kdsApi, getAuthToken, setAuthToken, setActiveRestaurant } from './src/services/api';
import { getAuthSession, clearAuthSession, saveSelectedRestaurant, getSelectedRestaurant } from './src/services/storage';
import { KDSHeader } from './src/components/KDSHeader';
import { NewOrderAlertBanner } from './src/components/NewOrderAlertBanner';
import { KDSTicketCard } from './src/components/KDSTicketCard';
import { ServerConfigModal } from './src/components/ServerConfigModal';
import { KDSLoginScreen } from './src/components/KDSLoginScreen';
import { HotelSelectionScreen } from './src/components/HotelSelectionScreen';

export default function App() {
  // Keep the device screen ON permanently while the kitchen app is open
  useKeepAwake();

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRestaurant, setSelectedRestaurantState] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isHotelSelectorOpen, setIsHotelSelectorOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Streamlined rush hour tabs: 'NEW' (Pending + Preparing) | 'HISTORY' (Ready + Served)
  const [activeTab, setActiveTab] = useState('NEW');

  // Sorting: FILO (First In Last Out / Newest first) by default
  const [sortOrder, setSortOrder] = useState('FILO');

  const [isRinging, setIsRinging] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const knownOrderIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // Optimistic Status Lock Map (orderId -> { status, expiresAt })
  // Prevents background polling race condition from reverting button state!
  const optimisticStatusRef = useRef(new Map());
  const inFlightStatusUpdatesRef = useRef(new Set());

  // Initialize native audio mode on boot
  useEffect(() => {
    initAudioMode();
  }, []);

  // Restore saved auth session & selected restaurant on boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const saved = await getAuthSession();
        if (saved?.token) {
          setAuthToken(saved.token);
          setCurrentUser(saved.user);

          const savedRest = await getSelectedRestaurant();
          if (savedRest) {
            setSelectedRestaurantState(savedRest);
            setActiveRestaurant(savedRest);
          }
        }
      } catch (e) {
        console.warn('Session restore note:', e);
      } finally {
        setIsAuthChecking(false);
      }
    }
    restoreSession();
  }, []);

  // Monitor screen orientation / width for tablets
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  const isTablet = windowWidth >= 768;

  // Fetch Live Orders for currently selected hotel
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!getAuthToken() || !selectedRestaurant) {
      return;
    }

    if (!isSilent) setIsRefreshing(true);
    try {
      const data = await kdsApi.getLiveOrders(selectedRestaurant.id);
      const list = Array.isArray(data) ? data : [];
      const now = Date.now();

      // Merge with active optimistic overrides so background poll NEVER reverts button state or causes bounce back!
      const mergedList = list.map(o => {
        const idKey = String(o.order_id);
        const opt = optimisticStatusRef.current.get(idKey);
        if (opt) {
          const serverStatus = (o.status || '').toUpperCase();
          const targetStatus = (opt.status || '').toUpperCase();

          if (serverStatus === targetStatus) {
            // Server has officially confirmed the target status! Release the lock.
            optimisticStatusRef.current.delete(idKey);
            return o;
          }

          if (now > opt.expiresAt) {
            // Safety timeout reached after 45s
            optimisticStatusRef.current.delete(idKey);
            return o;
          }

          // Backend hasn't updated its snapshot yet - ENFORCE the target status so the card never bounces back!
          return { ...o, status: opt.status };
        }
        return o;
      });

      // Check for newly arrived PENDING orders
      const newPending = mergedList.filter(o => 
        (o.status || 'PENDING').toUpperCase() === 'PENDING' &&
        !knownOrderIdsRef.current.has(o.order_id)
      );

      // Trigger siren sound and vibration alert on newly arrived orders
      if (!initialLoadRef.current && newPending.length > 0) {
        setIsRinging(true);
        Vibration.vibrate([600, 200, 600, 200, 600], true);
        playLoudAlarmSound();
      }

      mergedList.forEach(o => knownOrderIdsRef.current.add(o.order_id));
      initialLoadRef.current = false;

      setOrders(mergedList);
    } catch (err) {
      console.warn('[KDS Fetch Orders Error]:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedRestaurant]);

  // Polling loop (every 5 seconds) when hotel is selected
  useEffect(() => {
    if (currentUser && selectedRestaurant) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedRestaurant, fetchOrders]);

  const stopSiren = () => {
    setIsRinging(false);
    Vibration.cancel();
    stopLoudAlarmSound();
  };

  const handleTestSound = () => {
    if (isRinging) {
      stopSiren();
    } else {
      setIsRinging(true);
      Vibration.vibrate([600, 200, 600, 200, 600], true);
      playLoudAlarmSound();
    }
  };

  // Instant Single-Touch Status Update with Zero-Bounce Persistent Lock
  // PENDING -> PREPARING (stays in NEW tab instantly)
  // PREPARING -> READY (moves to HISTORY tab in 0ms with zero bounce back!)
  const handleUpdateStatus = useCallback(async (orderId, newStatus) => {
    const idKey = String(orderId);
    const upperStatus = (newStatus || '').toUpperCase();

    // Prevent duplicate triggers while in-flight
    if (inFlightStatusUpdatesRef.current.has(idKey)) return;
    inFlightStatusUpdatesRef.current.add(idKey);

    // 1. Instantly record persistent optimistic lock for 45 seconds.
    // It will NEVER be deleted prematurely by a setTimeout, preventing any bounce back!
    optimisticStatusRef.current.set(idKey, {
      status: upperStatus,
      expiresAt: Date.now() + 45000,
    });

    // 2. Immediately update state in 0ms so card instantly moves to History with no latency
    setOrders(prev => prev.map(o => String(o.order_id) === idKey ? { ...o, status: upperStatus } : o));

    // 3. Fire network update in background
    try {
      await kdsApi.updateOrderStatus(orderId, upperStatus);
      // The lock will be safely released in fetchOrders ONLY when the server confirms the new status!
    } catch (err) {
      console.warn('[Status Update Warning]:', err.message);
      // Revert lock only if network genuinely failed
      optimisticStatusRef.current.delete(idKey);
      fetchOrders(true);
    } finally {
      inFlightStatusUpdatesRef.current.delete(idKey);
    }
  }, [fetchOrders]);

  // Accept all pending: updates all PENDING to PREPARING immediately with zero-bounce lock
  const handleAcceptAllPending = async () => {
    stopSiren();
    const pendingList = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
    if (pendingList.length === 0) return;

    const now = Date.now();
    pendingList.forEach(ord => {
      const idKey = String(ord.order_id);
      optimisticStatusRef.current.set(idKey, {
        status: 'PREPARING',
        expiresAt: now + 45000,
      });
    });

    // 0ms instant UI update
    setOrders(prev => prev.map(o => (o.status || 'PENDING').toUpperCase() === 'PENDING' ? { ...o, status: 'PREPARING' } : o));

    // Fire calls in background
    for (const ord of pendingList) {
      try {
        await kdsApi.updateOrderStatus(ord.order_id, 'PREPARING');
      } catch (err) {}
    }
  };

  const handleSelectHotel = async (hotel) => {
    setSelectedRestaurantState(hotel);
    setActiveRestaurant(hotel);
    await saveSelectedRestaurant(hotel);
    setIsHotelSelectorOpen(false);
    knownOrderIdsRef.current.clear();
    initialLoadRef.current = true;
    setOrders([]);
  };

  const handleLogout = async () => {
    stopSiren();
    await clearAuthSession();
    setAuthToken(null);
    setCurrentUser(null);
    setSelectedRestaurantState(null);
    setIsHotelSelectorOpen(false);
    setOrders([]);
  };

  // 1. New Orders: PENDING & PREPARING
  const newOrders = orders.filter(o => {
    const s = (o.status || 'PENDING').toUpperCase();
    return s === 'PENDING' || s === 'PREPARING';
  });

  // 2. History Orders: READY & SERVED
  const historyOrders = orders.filter(o => {
    const s = (o.status || '').toUpperCase();
    return s === 'READY' || s === 'SERVED';
  });

  // Pending strictly for audio / alert banner
  const pendingOnly = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');

  // Filter based on active tab ('NEW' or 'HISTORY')
  const currentTabList = activeTab === 'NEW' ? newOrders : historyOrders;

  // Sort orders based on FILO (First In Last Out / Newest first) or FIFO (Oldest first)
  const sortedOrders = [...currentTabList].sort((a, b) => {
    if (sortOrder === 'FILO') {
      // FILO: Newest timestamp / highest bill number first
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.bill_no) || Number(b.order_id) || 0) - (Number(a.bill_no) || Number(a.order_id) || 0);
    } else {
      // FIFO: Oldest timestamp / lowest bill number first
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (Number(a.bill_no) || Number(a.order_id) || 0) - (Number(b.bill_no) || Number(b.order_id) || 0);
    }
  });

  if (isAuthChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={COLORS.bgSecondary} />
        
        {/* Step 1: Login Screen (Super Admin Credentials Only) */}
        {!currentUser ? (
          <KDSLoginScreen 
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              if (!selectedRestaurant) {
                setIsHotelSelectorOpen(true);
              }
            }}
            onOpenServerConfig={() => setIsServerModalOpen(true)}
          />
        ) : (!selectedRestaurant || isHotelSelectorOpen) ? (
          /* Step 2: Hotel Selection Screen (Shows Connected Hotels) */
          <HotelSelectionScreen 
            onSelectHotel={handleSelectHotel}
            selectedHotelId={selectedRestaurant?.id}
            canCancel={!!selectedRestaurant}
            onClose={() => setIsHotelSelectorOpen(false)}
            onLogout={handleLogout}
          />
        ) : (
          /* Step 3: Streamlined Two-Tab KDS / KOT Display (New vs History) */
          <View style={{ flex: 1 }}>
            {/* Top Header with clean two-row layout and Direct Sound Test Button */}
            <KDSHeader 
              selectedRestaurant={selectedRestaurant}
              onOpenHotelSelector={() => setIsHotelSelectorOpen(true)}
              onRefresh={() => fetchOrders(false)}
              isRefreshing={isRefreshing}
              isRinging={isRinging}
              onStopSiren={stopSiren}
              onTestSound={handleTestSound}
              onOpenServerConfig={() => setIsServerModalOpen(true)}
              onLogout={handleLogout}
              sortOrder={sortOrder}
              onToggleSortOrder={() => setSortOrder(prev => prev === 'FILO' ? 'FIFO' : 'FILO')}
            />

            {/* Swiggy / Zomato Flashing New Order Banner */}
            <NewOrderAlertBanner 
              newOrders={pendingOnly}
              onAcceptAll={handleAcceptAllPending}
              onMute={stopSiren}
            />

            {/* Streamlined Rush Hour Tabs: NEW & HISTORY */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'NEW' && styles.tabItemActive]}
                onPress={() => setActiveTab('NEW')}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <View style={styles.tabContentRow}>
                  <Text style={[styles.tabLabel, activeTab === 'NEW' && styles.tabLabelActive]}>
                    New Orders
                  </Text>
                  <View style={[styles.tabBadge, activeTab === 'NEW' ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                    <Text style={styles.tabBadgeText}>{newOrders.length}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'HISTORY' && styles.tabItemActive]}
                onPress={() => setActiveTab('HISTORY')}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <View style={styles.tabContentRow}>
                  <Text style={[styles.tabLabel, activeTab === 'HISTORY' && styles.tabLabelActive]}>
                    History
                  </Text>
                  <View style={[styles.tabBadge, activeTab === 'HISTORY' ? styles.tabBadgeHistoryActive : styles.tabBadgeInactive]}>
                    <Text style={styles.tabBadgeText}>{historyOrders.length}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* High Performance Smooth Order Cards Scroll */}
            <ScrollView 
              style={styles.orderScroll} 
              contentContainerStyle={styles.orderScrollContent}
              removeClippedSubviews={true}
              keyboardShouldPersistTaps="handled"
            >
              {sortedOrders.map(o => (
                <KDSTicketCard key={o.order_id} order={o} onUpdateStatus={handleUpdateStatus} />
              ))}

              {sortedOrders.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name={activeTab === 'NEW' ? "restaurant-outline" : "checkmark-done-circle-outline"} 
                    size={52} 
                    color={COLORS.textMuted} 
                  />
                  <Text style={styles.emptyTitle}>
                    {activeTab === 'NEW' ? 'No Active Kitchen Orders' : 'No Order History Yet'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {activeTab === 'NEW' 
                      ? 'New orders from cashier or customer app will arrive here.' 
                      : 'Orders marked as food ready will appear in this history tab.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Server Endpoint Config Modal */}
        <ServerConfigModal 
          visible={isServerModalOpen}
          isOpen={isServerModalOpen} 
          onClose={() => setIsServerModalOpen(false)} 
          onSaved={() => fetchOrders(false)}
          onChanged={() => fetchOrders(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.brand,
    backgroundColor: 'rgba(252, 128, 25, 0.05)',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.brand,
  },
  tabBadgeHistoryActive: {
    backgroundColor: COLORS.ready,
  },
  tabBadgeInactive: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  orderScroll: {
    flex: 1,
  },
  orderScrollContent: {
    padding: 12,
    paddingBottom: 28,
  },
  emptyState: {
    paddingVertical: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
