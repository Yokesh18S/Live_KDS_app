import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { NewOrderBanner } from './components/NewOrderBanner';
import { KanbanView } from './components/KanbanView';
import { GridView } from './components/GridView';
import { MobileView } from './components/MobileView';
import { PrintKOTModal } from './components/PrintKOTModal';
import { RecallDrawer } from './components/RecallDrawer';
import { LoginModal } from './components/LoginModal';
import { HotelSelectorModal } from './components/HotelSelectorModal';
import { kdsService, setActiveRestaurant, setAuthToken } from './services/api';
import { getAuthSession, clearAuthSession, saveSelectedRestaurant, getSelectedRestaurant } from './services/storage';
import { kdsAudio } from './utils/kotAudio';
import './styles/kds.css';

export function App() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [autoAccept, setAutoAccept] = useState(() => localStorage.getItem('kds_auto_accept') === 'true');
  
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRestaurant, setSelectedRestaurantState] = useState(null);

  const [audioState, setAudioState] = useState({ isUnlocked: false, isRinging: false, isMuted: false });
  const knownOrderIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);
  const optimisticStatusRef = useRef(new Map());
  const inFlightStatusUpdatesRef = useRef(new Set());

  // Restore session & selected restaurant
  useEffect(() => {
    async function restore() {
      try {
        const saved = await getAuthSession();
        if (saved?.token) {
          setAuthToken(saved.token);
          setCurrentUser(saved.user);

          const savedRest = await getSelectedRestaurant();
          if (savedRest) {
            setSelectedRestaurantState(savedRest);
            setActiveRestaurant(savedRest);
          } else {
            setIsHotelModalOpen(true);
          }
        } else {
          setIsLoginOpen(true);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  // Subscribe to audio controller
  useEffect(() => {
    const unsub = kdsAudio.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  // Fetch live orders for selected hotel
  const fetchLiveOrders = useCallback(async (isSilent = false) => {
    if (!selectedRestaurant) return;

    if (!isSilent) setIsRefreshing(true);
    try {
      const data = await kdsService.getLiveOrders(selectedRestaurant.id);
      const liveList = Array.isArray(data) ? data : [];

      const newlyArrivedPending = liveList.filter(o => 
        (o.status || 'PENDING').toUpperCase() === 'PENDING' &&
        !knownOrderIdsRef.current.has(o.order_id)
      );

      if (!initialLoadRef.current && newlyArrivedPending.length > 0) {
        if (autoAccept) {
          newlyArrivedPending.forEach(o => {
            handleUpdateStatus(o.order_id, 'PREPARING');
          });
          kdsAudio.playSingleChime();
        } else {
          kdsAudio.triggerNewOrderAlert(newlyArrivedPending.length);
        }
      }

      liveList.forEach(o => knownOrderIdsRef.current.add(o.order_id));
      initialLoadRef.current = false;

      const served = liveList.filter(o => (o.status || '').toUpperCase() === 'SERVED');
      if (served.length > 0) {
        setCompletedOrders(prev => {
          const map = new Map();
          [...served, ...prev].forEach(o => map.set(o.order_id, o));
          return Array.from(map.values()).slice(0, 50);
        });
      }

      const now = Date.now();
      const mergedList = liveList.map(o => {
        const idKey = String(o.order_id);
        const opt = optimisticStatusRef.current.get(idKey);
        if (opt) {
          const serverStatus = (o.status || '').toUpperCase();
          const targetStatus = (opt.status || '').toUpperCase();

          if (serverStatus === targetStatus) {
            optimisticStatusRef.current.delete(idKey);
            return o;
          }
          if (now > opt.expiresAt) {
            optimisticStatusRef.current.delete(idKey);
            return o;
          }
          return { ...o, status: opt.status };
        }
        return o;
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCutoffMs = startOfToday.getTime();
      const todayOrders = mergedList.filter(o => {
        if (!o.created_at) return true;
        let dStr = typeof o.created_at === 'string' ? o.created_at : String(o.created_at);
        if (!dStr.includes('Z') && !dStr.includes('+')) dStr = dStr.replace(' ', 'T') + 'Z';
        const t = new Date(dStr).getTime();
        return isNaN(t) || t >= todayCutoffMs;
      });
      setOrders(todayOrders);
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedRestaurant, autoAccept]);

  // Polling loop
  useEffect(() => {
    if (selectedRestaurant) {
      fetchLiveOrders();
      const interval = setInterval(() => {
        fetchLiveOrders(true);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedRestaurant, fetchLiveOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const idKey = String(orderId);
    const upperStatus = (newStatus || '').toUpperCase();

    if (inFlightStatusUpdatesRef.current.has(idKey)) return;
    inFlightStatusUpdatesRef.current.add(idKey);

    optimisticStatusRef.current.set(idKey, {
      status: upperStatus,
      expiresAt: Date.now() + 45000,
    });

    setOrders(prev => prev.map(o => String(o.order_id) === idKey ? { ...o, status: upperStatus } : o));

    try {
      await kdsService.updateOrderStatus(orderId, upperStatus);
    } catch (err) {
      console.error('Update status failed:', err);
      optimisticStatusRef.current.delete(idKey);
      fetchLiveOrders(true);
    } finally {
      inFlightStatusUpdatesRef.current.delete(idKey);
    }
  };

  const handleSelectHotel = async (hotel) => {
    setSelectedRestaurantState(hotel);
    setActiveRestaurant(hotel);
    await saveSelectedRestaurant(hotel);
    setIsHotelModalOpen(false);
    knownOrderIdsRef.current.clear();
    initialLoadRef.current = true;
    setOrders([]);
    fetchLiveOrders(false);
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setAuthToken(null);
    setCurrentUser(null);
    setSelectedRestaurantState(null);
    setOrders([]);
    setIsLoginOpen(true);
  };

  // Filter & Search
  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'DINE_IN' && order.order_type !== 'DINE_IN') return false;
    if (activeFilter === 'TAKEAWAY' && order.order_type !== 'TAKEAWAY') return false;
    if (activeFilter === 'DELIVERY' && order.order_type !== 'DELIVERY') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchBill = String(order.bill_number || '').toLowerCase().includes(q);
      const matchTable = String(order.table_number || '').toLowerCase().includes(q);
      const matchCustomer = String(order.customer_name || '').toLowerCase().includes(q);
      const matchItem = order.items?.some(i => (i.item_name || '').toLowerCase().includes(q));
      if (!matchBill && !matchTable && !matchCustomer && !matchItem) return false;
    }

    return true;
  });

  const pendingOrders = filteredOrders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');

  return (
    <div className="kds-root">
      <Header 
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedRestaurant={selectedRestaurant}
        onOpenHotelSelector={() => setIsHotelModalOpen(true)}
        onRefresh={() => fetchLiveOrders(false)}
        isRefreshing={isRefreshing}
        completedCount={completedOrders.length}
        onOpenRecall={() => setIsRecallOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentUser={currentUser}
      />

      <FilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        autoAccept={autoAccept}
        setAutoAccept={setAutoAccept}
        totalCount={orders.length}
        pendingCount={pendingOrders.length}
      />

      {/* Swiggy / Zomato Flashing Banner */}
      <NewOrderBanner 
        newOrders={pendingOrders}
        onAcceptAll={() => {
          kdsAudio.stopContinuousAlert();
          pendingOrders.forEach(o => handleUpdateStatus(o.order_id, 'PREPARING'));
        }}
        onMute={() => kdsAudio.stopContinuousAlert()}
      />

      {/* Main KDS Surface */}
      <main className="kds-surface">
        {!selectedRestaurant ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <h2 style={{ color: '#fff', fontSize: '1.4rem' }}>No Hotel Selected</h2>
            <p style={{ marginTop: '8px' }}>Please select a connected hotel branch to view live kitchen tickets.</p>
            <button 
              onClick={() => setIsHotelModalOpen(true)}
              style={{ marginTop: '16px', background: '#fc8019', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Select Connected Hotel
            </button>
          </div>
        ) : (
          viewMode === 'kanban' ? (
            <KanbanView 
              orders={filteredOrders}
              onUpdateStatus={handleUpdateStatus}
              onPrintKOT={(order) => setSelectedPrintOrder(order)}
            />
          ) : (
            <GridView 
              orders={filteredOrders}
              onUpdateStatus={handleUpdateStatus}
              onPrintKOT={(order) => setSelectedPrintOrder(order)}
            />
          )
        )}
      </main>

      {/* Hotel Selection Modal */}
      <HotelSelectorModal 
        isOpen={isHotelModalOpen}
        onClose={() => setIsHotelModalOpen(false)}
        selectedHotelId={selectedRestaurant?.id}
        onSelectHotel={handleSelectHotel}
        canCancel={!!selectedRestaurant}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          if (!selectedRestaurant) {
            setIsHotelModalOpen(true);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Bumped Order Recall Drawer */}
      <RecallDrawer 
        isOpen={isRecallOpen}
        onClose={() => setIsRecallOpen(false)}
        completedOrders={completedOrders}
        onRecallOrder={(orderId) => {
          handleUpdateStatus(orderId, 'READY');
          setIsRecallOpen(false);
        }}
      />

      {/* KOT Print Preview Modal */}
      <PrintKOTModal 
        order={selectedPrintOrder}
        onClose={() => setSelectedPrintOrder(null)}
      />
    </div>
  );
}

export default App;
