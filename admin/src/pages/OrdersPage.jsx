import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderMap from '../components/OrderMap.jsx';

const NEXT_STATUS = {
  submitted: 'confirmed',
  confirmed: 'dispatched',
  dispatched: 'delivered',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await api.listOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function advance(o) {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    await api.updateOrderStatus(o.id, next);
    load();
  }

  async function cancel(o) {
    if (!confirm(`Cancel ${o.id}?`)) return;
    await api.updateOrderStatus(o.id, 'cancelled');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <button
          onClick={load}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <OrderMap orders={orders} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-3">
                  {o.items
                    .map((it) => `${it.quantity}× ${it.name}`)
                    .join(', ')}
                </td>
                <td className="px-4 py-3">
                  <div>{o.customerName || '—'}</div>
                  <div className="text-xs text-slate-500">
                    {o.customerPhone || ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                  <div>{o.address || '—'}</div>
                  {o.lat && o.lon && (
                    <div className="text-slate-400 mt-0.5">
                      {o.lat.toFixed(4)}, {o.lon.toFixed(4)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {o.total} ETB
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  {NEXT_STATUS[o.status] && (
                    <button
                      onClick={() => advance(o)}
                      className="text-xs px-2 py-1 rounded-md bg-brand text-white"
                    >
                      → {NEXT_STATUS[o.status]}
                    </button>
                  )}
                  {o.status !== 'delivered' && o.status !== 'cancelled' && (
                    <button
                      onClick={() => cancel(o)}
                      className="text-xs px-2 py-1 rounded-md bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
