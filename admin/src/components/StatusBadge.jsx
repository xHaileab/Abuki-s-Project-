const COLORS = {
  submitted: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  dispatched: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-600',
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}
