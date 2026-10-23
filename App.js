import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Vibration, 
  Dimensions 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';
import { kdsApi, getAuthToken, setAuthToken } from './src/services/api';
import { getAuthSession, clearAuthSession } from './src/services/storage';
import { KDSHeader } from './src/components/KDSHeader';
import { NewOrderAlertBanner } from './src/components/NewOrderAlertBanner';
import { KDSTicketCard } from './src/components/KDSTicketCard';
import { ServerConfigModal } from './src/components/ServerConfigModal';
import { RecallModal } from './src/components/RecallModal';
import { KDSLoginScreen } from './src/components/KDSLoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'PREPARING' | 'READY' | 'ALL'
  const [isRinging, setIsRinging] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const knownOrderIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // Restore saved auth session on boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const saved = await getAuthSession();
        if (saved?.token) {
          setAuthToken(saved.token);
          setCurrentUser(saved.user);
        }
      } catch (e) {
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

  // Fetch Live Orders from FastAPI Backend (only if authenticated)
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!getAuthToken()) {
      return; // Do not spam requests if not logged in
    }

    if (!isSilent) setIsRefreshing(true);
    try {
      const data = await kdsApi.getLiveOrders();
      const list = Array.isArray(data) ? data : [];

      // Check for newly arrived PENDING orders
      const newPending = list.filter(o => 
        (o.status || 'PENDING').toUpperCase() === 'PENDING' &&
        !knownOrderIdsRef.current.has(o.order_id)
      );

      // Trigger siren / vibration alert on newly arrived orders
      if (!initialLoadRef.current && newPending.length > 0) {
        setIsRinging(true);
        Vibration.vibrate([400, 200, 400], true);
      }

      list.forEach(o => knownOrderIdsRef.current.add(o.order_id));
      initialLoadRef.current = false;

      // Extract recently completed
      const served = list.filter(o => (o.status || '').toUpperCase() === 'SERVED');
      if (served.length > 0) {
        setCompletedOrders(prev => {
          const map = new Map();
          [...served, ...prev].forEach(o => map.set(o.order_id, o));
          return Array.from(map.values()).slice(0, 30);
        });
      }

      setOrders(list);
    } catch (err) {
      console.warn('[Expo KDS] Fetch note:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Polling loop (every 5 seconds)
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchOrders]);

  const stopSiren = () => {
    setIsRinging(false);
    Vibration.cancel();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    try {
      await kdsApi.updateOrderStatus(orderId, newStatus);
      fetchOrders(true);
    } catch (err) {
      console.warn('Update status error:', err);
      fetchOrders(true);
    }
  };

  const handleAcceptAllPending = async () => {
    stopSiren();
    const pending = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
    for (const ord of pending) {
      handleUpdateStatus(ord.order_id, 'PREPARING');
    }
  };

  const handleRecallOrder = async (orderId) => {
    await handleUpdateStatus(orderId, 'READY');
    setIsRecallModalOpen(false);
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setAuthToken(null);
    setCurrentUser(null);
    setOrders([]);
  };

  const pending = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
  const preparing = orders.filter(o => (o.status || '').toUpperCase() === 'PREPARING');
  const ready = orders.filter(o => (o.status || '').toUpperCase() === 'READY');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'PENDING': return pending;
      case 'PREPARING': return preparing;
      case 'READY': return ready;
      default: return orders.filter(o => o.status !== 'SERVED');
    }
  };

  const displayOrders = getFilteredList();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={COLORS.bgSecondary} />
        
        {/* If staff is not logged in, show Kitchen Sign In Screen */}
        {!currentUser ? (
          <KDSLoginScreen 
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              fetchOrders(false);
            }}
            onOpenServerConfig={() => setIsServerModalOpen(true)}
          />
        ) : (
          <View style={{ flex: 1 }}>
            {/* Top Header */}
            <KDSHeader 
              onRefresh={() => fetchOrders(false)}
              isRefreshing={isRefreshing}
              isRinging={isRinging}
              onStopSiren={stopSiren}
              onOpenServerConfig={() => setIsServerModalOpen(true)}
              onOpenRecall={() => setIsRecallModalOpen(true)}
              completedCount={completedOrders.length}
            />

            {/* Swiggy / Zomato Flashing New Order Banner */}
            <NewOrderAlertBanner 
              newOrders={pending}
              onAcceptAll={handleAcceptAllPending}
              onMute={stopSiren}
            />

            {/* Tablet Multi-Column Layout */}
            {isTablet ? (
              <View style={styles.tabletColumns}>
                {/* Column 1: New Orders */}
                <View style={[styles.column, { borderTopColor: COLORS.pending }]}>
                  <View style={styles.columnHeader}>
                    <Text style={[styles.columnTitle, { color: COLORS.pending }]}>New Orders</Text>
                    <View style={styles.columnBadge}><Text style={styles.badgeNumber}>{pending.length}</Text></View>
                  </View>
                  <ScrollView style={styles.columnScroll}>
                    {pending.map(o => (
                      <KDSTicketCard key={o.order_id} order={o} onUpdateStatus={handleUpdateStatus} />
                    ))}
                  </ScrollView>
                </View>

                {/* Column 2: In Kitchen */}
                <View style={[styles.column, { borderTopColor: COLORS.prep }]}>
                  <View style={styles.columnHeader}>
                    <Text style={[styles.columnTitle, { color: COLORS.prep }]}>Cooking / In Kitchen</Text>
                    <View style={styles.columnBadge}><Text style={styles.badgeNumber}>{preparing.length}</Text></View>
                  </View>
                  <ScrollView style={styles.columnScroll}>
                    {preparing.map(o => (
                      <KDSTicketCard key={o.order_id} order={o} onUpdateStatus={handleUpdateStatus} />
                    ))}
                  </ScrollView>
                </View>

                {/* Column 3: Ready */}
                <View style={[styles.column, { borderTopColor: COLORS.ready }]}>
                  <View style={styles.columnHeader}>
                    <Text style={[styles.columnTitle, { color: COLORS.ready }]}>Ready to Serve</Text>
                    <View style={styles.columnBadge}><Text style={styles.badgeNumber}>{ready.length}</Text></View>
                  </View>
                  <ScrollView style={styles.columnScroll}>
                    {ready.map(o => (
                      <KDSTicketCard key={o.order_id} order={o} onUpdateStatus={handleUpdateStatus} />
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              /* Mobile Phone Layout with Segmented Top Bar */
              <View style={{ flex: 1 }}>
                <View style={styles.tabBar}>
                  <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'PENDING' && { backgroundColor: COLORS.pending }]}
                    onPress={() => setActiveTab('PENDING')}
                  >
                    <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
                      New ({pending.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'PREPARING' && { backgroundColor: COLORS.prep }]}
                    onPress={() => setActiveTab('PREPARING')}
                  >
                    <Text style={[styles.tabText, activeTab === 'PREPARING' && { color: '#000', fontWeight: '800' }]}>
                      Cooking ({preparing.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'READY' && { backgroundColor: COLORS.ready }]}
                    onPress={() => setActiveTab('READY')}
                  >
                    <Text style={[styles.tabText, activeTab === 'READY' && styles.tabTextActive]}>
                      Ready ({ready.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.mobileList} contentContainerStyle={{ padding: 12 }}>
                  {displayOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="restaurant-outline" size={38} color={COLORS.textMuted} />
                      <Text style={styles.emptyText}>No orders in this stage.</Text>
                    </View>
                  ) : (
                    displayOrders.map(o => (
                      <KDSTicketCard key={o.order_id} order={o} onUpdateStatus={handleUpdateStatus} />
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Server Config Modal */}
        <ServerConfigModal 
          visible={isServerModalOpen} 
          onClose={() => setIsServerModalOpen(false)}
          onSaved={() => fetchOrders(false)}
        />

        {/* Recall / Bumped Orders Modal */}
        <RecallModal 
          visible={isRecallModalOpen}
          onClose={() => setIsRecallModalOpen(false)}
          completedOrders={completedOrders}
          onRecall={handleRecallOrder}
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
  tabletColumns: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  column: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderTopWidth: 4,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  columnBadge: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  columnScroll: {
    padding: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    padding: 6,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  mobileList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
