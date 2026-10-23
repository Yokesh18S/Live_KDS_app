import React from 'react';
import { Search, Utensils, ShoppingBag, Bike, Zap } from 'lucide-react';

export const FilterBar = ({ 
  activeFilter, 
  setActiveFilter, 
  counts, 
  searchTerm, 
  setSearchTerm,
  autoAccept,
  setAutoAccept
}) => {
  return (
    <div className="kds-filters">
      <div className="filter-pills">
        <button 
          className={`pill-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          <span>All Orders</span>
          <span className="pill-count">{counts.all}</span>
        </button>

        <button 
          className={`pill-btn ${activeFilter === 'DINE_IN' ? 'active' : ''}`}
          onClick={() => setActiveFilter('DINE_IN')}
        >
          <Utensils size={14} />
          <span>Dine-In</span>
          <span className="pill-count">{counts.dineIn}</span>
        </button>

        <button 
          className={`pill-btn ${activeFilter === 'TAKEAWAY' ? 'active' : ''}`}
          onClick={() => setActiveFilter('TAKEAWAY')}
        >
          <ShoppingBag size={14} />
          <span>Takeaway</span>
          <span className="pill-count">{counts.takeaway}</span>
        </button>

        <button 
          className={`pill-btn ${activeFilter === 'DELIVERY' ? 'active' : ''}`}
          onClick={() => setActiveFilter('DELIVERY')}
        >
          <Bike size={14} />
          <span>Delivery</span>
          <span className="pill-count">{counts.delivery}</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search Input */}
        <div className="search-box">
          <Search size={15} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search Table, Bill #, Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Auto-Accept Toggle */}
        <button 
          className={`pill-btn ${autoAccept ? 'active' : ''}`}
          onClick={() => setAutoAccept(!autoAccept)}
          title="Auto Accept: Automatically move new customer orders to Preparing"
          style={{ padding: '6px 12px' }}
        >
          <Zap size={14} color={autoAccept ? "#fff" : "var(--color-prep)"} />
          <span style={{ fontSize: '0.75rem' }}>Auto-Accept: {autoAccept ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
