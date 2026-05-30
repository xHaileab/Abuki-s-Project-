import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import {
  Package,
  RefreshCw,
  ChevronRight,
  X,
  Inbox,
  Clock,
  Truck,
  CircleDollarSign,
  MapPin,
} from 'lucide-react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  Button,
  Card,
  PageHeader,
  StatCard,
  EmptyState,
  ErrorBanner,
  Spinner,
} from '../components/ui.jsx';

const OrderMap = lazy(() => import('../components/OrderMap.jsx'));

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

  const active = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;
  const inTransit = orders.filter((o) => o.status === 'dispatched').length;
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Track and fulfil incoming orders"
        icon={Package}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
        }
      />

      <ErrorBanner>{error}</ErrorBanner>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total orders" value={orders.length} icon={Inbox} tone="brand" />
        <StatCard label="Active" value={active} icon={Clock} tone="amber" />
        <StatCard label="In transit" value={inTransit} icon={Truck} tone="violet" />
        <StatCard
          label="Revenue (ETB)"
          value={revenue.toLocaleString()}
          icon={CircleDollarSign}
          tone="emerald"
        />
      </div>

      <Suspense
        fallback={
          <Card className="h-[360px] grid place-items-center text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" /> Loading map…
            </span>
          </Card>
        }
      >
        <OrderMap orders={orders} />
      </Suspense>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Spinner className="w-4 h-4" /> Loading…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Inbox}
                      title="No orders yet"
                      hint="Orders placed from the mobile app will appear here in real time."
                    />
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {o.id}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {o.customerName || '—'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {o.customerPhone || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                    <div className="flex items-start gap-1">
                      {o.address && (
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      )}
                      <span>{o.address || '—'}</span>
                    </div>
                    {o.lat && o.lon && (
                      <div className="text-slate-400 mt-0.5 pl-[18px]">
                        {o.lat.toFixed(4)}, {o.lon.toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {Number(o.total).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {NEXT_STATUS[o.status] && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => advance(o)}
                          className="capitalize"
                        >
                          {NEXT_STATUS[o.status]}
                          <ChevronRight className="w-3.5 h-3.5 -mr-1" />
                        </Button>
                      )}
                      {o.status !== 'delivered' && o.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={X}
                          onClick={() => cancel(o)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
