import { useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { useHospital } from '../contexts/HospitalContext';

interface Order {
  id: string;
  medicine: string;
  quantity: number;
  unit: string;
  supplier: string;
  status: 'Pending' | 'Approved' | 'Shipped' | 'Delivered';
  priority: 'Emergency' | 'High' | 'Normal';
  requestedBy: string;
  date: string;
}

const SAMPLE_ORDERS: Order[] = [
  { id: 'ORD-001', medicine: 'Propofol 200mg/20ml', quantity: 50, unit: 'vials', supplier: 'MedSupply India', status: 'Pending', priority: 'Emergency', requestedBy: 'Pharm. Vikram', date: 'Today 10:30' },
  { id: 'ORD-002', medicine: 'Insulin (Rapid-acting)', quantity: 200, unit: 'units', supplier: 'Novo Nordisk', status: 'Approved', priority: 'High', requestedBy: 'Pharm. Vikram', date: 'Today 09:15' },
  { id: 'ORD-003', medicine: 'Amoxicillin 500mg', quantity: 500, unit: 'tablets', supplier: 'Generic Pharma', status: 'Shipped', priority: 'Normal', requestedBy: 'Pharm. Vikram', date: 'Yesterday 14:00' },
  { id: 'ORD-004', medicine: 'Ceftriaxone 1g IV', quantity: 100, unit: 'vials', supplier: 'MedSupply India', status: 'Delivered', priority: 'High', requestedBy: 'Pharm. Vikram', date: 'Yesterday 11:00' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Pending:   { color: '#9A7535', bg: '#F5EDD8', border: '#D9B97A' },
  Approved:  { color: '#34483A', bg: '#E8EDE6', border: '#C5CEBC' },
  Shipped:   { color: '#9A7535', bg: '#F5EDD8', border: '#D9B97A' },
  Delivered: { color: '#34483A', bg: '#EFF3ED', border: '#A8B39F' },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Emergency: { color: '#8F5540', bg: '#FBF0EC', border: '#D4957E' },
  High:      { color: '#9A7535', bg: '#F5EDD8', border: '#D9B97A' },
  Normal:    { color: '#5C5A54', bg: '#F2EFE8', border: '#C8C3BB' },
};

export default function OrdersPage() {
  const { state } = useHospital();
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [filter, setFilter] = useState<'All' | Order['status']>('All');
  const [showForm, setShowForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ medicine: '', quantity: '', unit: 'tablets', priority: 'Normal' as Order['priority'] });

  const criticalMeds = state.medicines.filter((m) => m.risk === 'Critical');
  const filtered = orders.filter((o) => filter === 'All' || o.status === filter);

  const submitOrder = () => {
    if (!newOrder.medicine || !newOrder.quantity) return;
    const order: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      medicine: newOrder.medicine,
      quantity: parseInt(newOrder.quantity) || 1,
      unit: newOrder.unit,
      supplier: 'MedSupply India',
      status: 'Pending',
      priority: newOrder.priority,
      requestedBy: 'Pharm. Vikram',
      date: 'Just now',
    };
    setOrders((prev) => [order, ...prev]);
    setShowForm(false);
    setNewOrder({ medicine: '', quantity: '', unit: 'tablets', priority: 'Normal' });
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#78856F]" />
            Medicine Orders
          </h1>
          <p className="page-subtitle">Procurement orders and status tracking</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1">
          <Plus size={14} /> New Order
        </button>
      </div>

      {/* AI Suggested */}
      {criticalMeds.length > 0 && (
        <div className="rounded-lg p-3 border" style={{ background: '#FBF0EC', borderColor: '#D4957E' }}>
          <div className="text-xs font-semibold text-[#8F5540] mb-2">AI Suggests Emergency Orders:</div>
          <div className="space-y-1">
            {criticalMeds.slice(0, 3).map((m) => (
              <div key={m.id} className="text-sm text-[#5C5A54]">
                • <strong>{m.name}</strong> — only {Math.round(m.stock / m.dailyUsage)} days left
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['All', 'Pending', 'Approved', 'Shipped', 'Delivered'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-md border transition-all font-medium ${
              filter === f
                ? 'bg-[#34483A] text-white border-[#34483A]'
                : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const ss = STATUS_STYLE[order.status];
          const ps = PRIORITY_STYLE[order.priority];
          return (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs text-[#8C8A83]">{order.id} · {order.date}</div>
                  <div className="text-sm font-semibold text-[#292824]">{order.medicine}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0"
                  style={{ color: ss.color, background: ss.bg, borderColor: ss.border }}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#8C8A83]">
                <span>Qty: <span className="text-[#292824] font-medium">{order.quantity} {order.unit}</span></span>
                <span>Supplier: <span className="text-[#292824]">{order.supplier}</span></span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={{ color: ps.color, background: ps.bg, borderColor: ps.border }}
                >
                  {order.priority} Priority
                </span>
                <span className="text-xs text-[#8C8A83]">By: {order.requestedBy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Order Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-6 w-full max-w-md mx-4 space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-[#292824]">New Procurement Order</h3>
            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1">Medicine Name</label>
              <input
                value={newOrder.medicine}
                onChange={(e) => setNewOrder((p) => ({ ...p, medicine: e.target.value }))}
                className="w-full bg-white border border-warm-300 rounded-lg px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-sage-400"
                placeholder="e.g. Propofol 200mg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder((p) => ({ ...p, quantity: e.target.value }))}
                  className="w-full bg-white border border-warm-300 rounded-lg px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-sage-400"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1">Unit</label>
                <select
                  value={newOrder.unit}
                  onChange={(e) => setNewOrder((p) => ({ ...p, unit: e.target.value }))}
                  className="w-full bg-white border border-warm-300 rounded-lg px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-sage-400"
                >
                  <option>tablets</option>
                  <option>vials</option>
                  <option>units</option>
                  <option>mg</option>
                  <option>ml</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1">Priority</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder((p) => ({ ...p, priority: e.target.value as Order['priority'] }))}
                className="w-full bg-white border border-warm-300 rounded-lg px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-sage-400"
              >
                <option>Normal</option>
                <option>High</option>
                <option>Emergency</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={submitOrder} className="btn-primary flex-1">Submit Order</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
