import { Loader2 } from 'lucide-react';

/**
 * Small shared UI kit so every admin page renders with the same buttons,
 * cards, headers, and empty/loading states. Keeps Tailwind classes in one
 * place instead of copy-pasted across pages.
 */

const VARIANTS = {
  primary:
    'bg-brand text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  accent:
    'bg-brand-accent text-white hover:brightness-105 active:brightness-95 shadow-sm',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      {children}
    </button>
  );
}

/** Icon-only square button, used inline in tables. */
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  title,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      title={title}
      aria-label={title}
      className={`inline-grid place-items-center w-8 h-8 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${VARIANTS[variant]} ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <div
      {...props}
      className={`bg-white rounded-2xl border border-slate-200/70 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand grid place-items-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold tabular-nums leading-none text-slate-900">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1 truncate">
          {label}
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} />;
}

export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 animate-fade-in">
      {children}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

/** Shared input styling. Spread onto <input>/<textarea>. */
export const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
