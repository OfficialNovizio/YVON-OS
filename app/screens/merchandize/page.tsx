'use client';

import { useState } from 'react';

type Tab = 'collections' | 'products' | 'inventory' | 'drops';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'collections', label: 'Collections', icon: 'style' },
  { id: 'products',    label: 'Products',    icon: 'inventory_2' },
  { id: 'inventory',  label: 'Inventory',   icon: 'warehouse' },
  { id: 'drops',      label: 'Drops',       icon: 'event' },
];

export default function MerchandizePage() {
  const [activeTab, setActiveTab] = useState<Tab>('collections');

  return (
    <main className="pt-14 min-h-screen bg-black text-[var(--color-text)]">
      <div className="max-w-screen-2xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E94560] bg-[#E94560]/10 border border-[#E94560]/20 px-2.5 py-1 rounded-full">
                Novizio Exclusive
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchandize</h1>
            <p className="text-[13px] text-[var(--color-muted)] mt-1">
              Manage collections, products, inventory, and upcoming drops.
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#E94560] hover:bg-[#E94560]/90 text-white text-[13px] font-semibold rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Product
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Collections', value: '—', icon: 'style',      color: '#E94560' },
            { label: 'Total SKUs',         value: '—', icon: 'inventory_2', color: '#0F3460' },
            { label: 'Low Stock Alerts',   value: '—', icon: 'warning',     color: '#F59E0B' },
            { label: 'Next Drop',          value: '—', icon: 'event',       color: '#10B981' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ color: kpi.color }}
                >
                  {kpi.icon}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#E94560] text-white'
                  : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          {activeTab === 'collections' && <CollectionsTab />}
          {activeTab === 'products'    && <ProductsTab />}
          {activeTab === 'inventory'   && <InventoryTab />}
          {activeTab === 'drops'       && <DropsTab />}
        </div>
      </div>
    </main>
  );
}

// ─── Tab Components ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, description, cta }: {
  icon: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <span className="material-symbols-outlined text-[48px] text-[var(--color-muted)]/40 mb-4">
        {icon}
      </span>
      <p className="text-[15px] font-semibold text-white mb-2">{title}</p>
      <p className="text-[13px] text-[var(--color-muted)] max-w-sm mb-6">{description}</p>
      <button className="flex items-center gap-2 px-4 py-2 bg-[#E94560] hover:bg-[#E94560]/90 text-white text-[13px] font-semibold rounded-lg transition-colors">
        <span className="material-symbols-outlined text-[15px]">add</span>
        {cta}
      </button>
    </div>
  );
}

function CollectionsTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Collections</h2>
        <span className="text-[11px] text-[var(--color-muted)]">SS26 · FW25 · Archive</span>
      </div>
      <EmptyState
        icon="style"
        title="No collections yet"
        description="Create your first collection to start organising Novizio's product lines and seasonal drops."
        cta="Create Collection"
      />
    </div>
  );
}

function ProductsTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Products</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search SKUs..."
            className="bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#E94560]/50 w-48"
          />
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[var(--color-border)] hover:bg-white/10 rounded-lg text-[12px] text-[var(--color-muted)] transition-colors">
            <span className="material-symbols-outlined text-[14px]">filter_list</span>
            Filter
          </button>
        </div>
      </div>
      <EmptyState
        icon="inventory_2"
        title="No products added"
        description="Add products with variants, pricing, and SKU details to start tracking your Novizio catalogue."
        cta="Add Product"
      />
    </div>
  );
}

function InventoryTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Inventory</h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            0 low stock
          </span>
        </div>
      </div>
      <EmptyState
        icon="warehouse"
        title="No inventory tracked"
        description="Once products are added, track stock levels, set low-stock thresholds, and get alerts before you run out."
        cta="Add Product First"
      />
    </div>
  );
}

function DropsTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Upcoming Drops</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E94560]/10 border border-[#E94560]/20 hover:bg-[#E94560]/20 rounded-lg text-[12px] text-[#E94560] font-semibold transition-colors">
          <span className="material-symbols-outlined text-[14px]">add</span>
          Schedule Drop
        </button>
      </div>
      <EmptyState
        icon="event"
        title="No drops scheduled"
        description="Plan Novizio product drops with dates, linked collections, and pre-launch inventory checks."
        cta="Schedule a Drop"
      />
    </div>
  );
}
