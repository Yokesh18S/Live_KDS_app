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
import { kdsService } from './services/api';
import { kdsAudio } from './utils/kotAudio';
import './styles/kds.css';

export function App() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid'
  const [autoAccept, setAutoAccept] = useState(() => {
    return localStorage.getItem('kds_auto_accept') === 'true';
  });
  
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('kds_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const [audioState, setAudioState] = useState({ isUnlocked: false, isRinging: false, isMuted: false });
  const knownOrderIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // Subscribe to audio controller
  useEffect(() => {
    const unsub = kdsAudio.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  // Request screen wake-lock to prevent tablet/TV screen sleep
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {}
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Persist auto-accept setting
  useEffect(() => {
    localStorage.setItem('kds_auto_accept', String(autoAccept));
  }, [autoAccept]);

  // Fetch live orders
  const fetchLiveOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const data = await kdsService.getLiveOrders();
      const liveList = Array.isArray(data) ? data : [];

      // Check for newly arrived PENDING orders to trigger Swiggy/Zomato style audio alert
      const currentIds = new Set(liveList.map(o => o.order_id));
      const newlyArrivedPending = liveList.filter(o => 
        (o.status || 'PENDING').toUpperCase() === 'PENDING' &&
        !knownOrderIdsRef.current.has(o.order_id)
      );

      // On subsequent polling cycles, ring siren if new pending orders arrived
      if (!initialLoadRef.current && newlyArrivedPending.length > 0) {
        if (autoAccept) {
          // If auto-accept is turned on, automatically move them to PREPARING
          newlyArrivedPending.forEach(o => {
            handleUpdateStatus(o.order_id, 'PREPARING');
          });
          kdsAudio.playSingleChime();
        } else {
          // Ring siren continuously until accepted
          kdsAudio.startContinuousAlert();
        }
      }

      // Update known IDs
      currentIds.forEach(id => knownOrderIdsRef.current.add(id));
      initialLoadRef.current = false;

      // Extract recently served orders into history
      const served = liveList.filter(o => (o.status || '').toUpperCase() === 'SERVED');
      if (served.length > 0) {
        setCompletedOrders(prev => {
          const map = new Map();
          [...served, ...prev].forEach(o => map.set(o.order_id, o));
          return Array.from(map.values()).slice(0, 30);
        });
      }

      setOrders(liveList);
    } catch (err) {
      console.warn('[KDS] Live fetch note:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [autoAccept]);

  // Polling heartbeat (every 5 seconds)
  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(() => {
      fetchLiveOrders(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveOrders]);

  // Order status progression
  const handleUpdateStatus = async (orderId, newStatus) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));

    try {
      await kdsService.updateOrderStatus(orderId, newStatus);
      fetchLiveOrders(true);
    } catch (err) {
      console.error('Error updating status:', err);
      fetchLiveOrders(true);
    }
  };

  // Accept all pending orders in one tap
  const handleAcceptAllPending = async () => {
    const pending = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');
    kdsAudio.stopContinuousAlert();

    for (const ord of pending) {
      handleUpdateStatus(ord.order_id, 'PREPARING');
    }
  };

  // Recall / restore completed order back to Ready
  const handleRecallOrder = async (orderId) => {
    await handleUpdateStatus(orderId, 'READY');
    setIsRecallOpen(false);
  };

  // Filter orders by activeFilter and searchTerm
  const filteredOrders = orders.filter(order => {
    const type = (order.order_type || '').toUpperCase();
    const table = (order.table_number || '').toString().trim().toUpperCase();
    const isDelivery = type === 'DELIVERY' || !!order.delivery_address;
    const isTakeaway = !isDelivery && (type === 'TAKEAWAY' || table === 'TAKEAWAY' || table === 'N/A' || !table);
    const isDineIn = !isDelivery && !isTakeaway;

    if (activeFilter === 'DINE_IN' && !isDineIn) return false;
    if (activeFilter === 'TAKEAWAY' && !isTakeaway) return false;
    if (activeFilter === 'DELIVERY' && !isDelivery) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTable = (order.table_number || '').toLowerCase().includes(q);
      const matchBill = (order.bill_no || '').toString().includes(q);
      const matchId = (order.branch_order_id || order.order_id || '').toString().includes(q);
      const matchCust = (order.customer_name || '').toLowerCase().includes(q);
      const matchItem = (order.items || []).some(i => (i.name || '').toLowerCase().includes(q));
      if (!matchTable && !matchBill && !matchId && !matchCust && !matchItem) return false;
    }

    return true;
  });

  // Calculate counts for FilterBar pills
  const counts = {
    all: orders.filter(o => o.status !== 'SERVED').length,
    dineIn: orders.filter(o => {
      const isDel = o.order_type === 'DELIVERY' || !!o.delivery_address;
      const isTake = !isDel && (o.order_type === 'TAKEAWAY' || !o.table_number || o.table_number === 'N/A' || o.table_number === 'takeaway');
      return !isDel && !isTake && o.status !== 'SERVED';
    }).length,
    takeaway: orders.filter(o => {
      const isDel = o.order_type === 'DELIVERY' || !!o.delivery_address;
      const isTake = !isDel && (o.order_type === 'TAKEAWAY' || !o.table_number || o.table_number === 'N/A' || o.table_number === 'takeaway');
      return isTake && o.status !== 'SERVED';
    }).length,
    delivery: orders.filter(o => (o.order_type === 'DELIVERY' || !!o.delivery_address) && o.status !== 'SERVED').length,
  };

  const pendingOrders = orders.filter(o => (o.status || 'PENDING').toUpperCase() === 'PENDING');

  return (
    <div className="kds-app">
      {/* Tap-to-Unlock Audio Banner if mobile browser blocked audio autoplay */}
      {!audioState.isUnlocked && (
        <div className="audio-unlock-banner" onClick={() => kdsAudio.unlock()}>
          <span>🔊 Kitchen Audio Notice: Tap anywhere to enable loud KOT bell alarms</span>
          <button onClick={() => kdsAudio.unlock()}>Enable Audio</button>
        </div>
      )}

      {/* Header */}
      <Header 
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={() => fetchLiveOrders(false)}
        isRefreshing={isRefreshing}
        completedCount={completedOrders.length}
        onOpenRecall={() => setIsRecallOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentUser={currentUser}
      />

      {/* Swiggy/Zomato New Order Alert Banner */}
      <NewOrderBanner 
        newOrders={pendingOrders}
        onAcceptAll={handleAcceptAllPending}
        onAcceptSingle={(id) => handleUpdateStatus(id, 'PREPARING')}
      />

      {/* Filter Bar */}
      <FilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        counts={counts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        autoAccept={autoAccept}
        setAutoAccept={setAutoAccept}
      />

      {/* Main Content Area */}
      <main className="kds-content">
        {/* Desktop / Large Screen Kanban View */}
        <div className="desktop-view">
          {viewMode === 'kanban' ? (
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
          )}
        </div>

        {/* Mobile Phone Specific View */}
        <MobileView 
          orders={filteredOrders}
          onUpdateStatus={handleUpdateStatus}
          onPrintKOT={(order) => setSelectedPrintOrder(order)}
          onOpenRecall={() => setIsRecallOpen(true)}
        />
      </main>

      {/* Thermal KOT Print Modal */}
      {selectedPrintOrder && (
        <PrintKOTModal 
          order={selectedPrintOrder}
          onClose={() => setSelectedPrintOrder(null)}
        />
      )}

      {/* Recall Recently Bumped Orders Drawer */}
      <RecallDrawer 
        isOpen={isRecallOpen}
        onClose={() => setIsRecallOpen(false)}
        completedOrders={completedOrders}
        onRecallOrder={handleRecallOrder}
      />

      {/* Staff Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(u) => setCurrentUser(u)}
        onLogout={() => {
          localStorage.removeItem('kds_access_token');
          localStorage.removeItem('kds_user');
          setCurrentUser(null);
        }}
      />
    </div>
  );
}

export default App;
