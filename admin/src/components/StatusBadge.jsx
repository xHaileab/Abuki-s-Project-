const STYLES = {
  submitted: { badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  confirmed: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  dispatched: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-500' },
  delivered: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  cancelled: { badge: 'bg-slate-100 text-slate-500 ring-slate-400/20', dot: 'bg-slate-400' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ring-1 ring-inset ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
