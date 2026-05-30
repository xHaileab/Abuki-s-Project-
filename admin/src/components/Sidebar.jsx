import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Megaphone, Settings, LogOut } from 'lucide-react';
import { setToken } from '../auth.js';

const ITEMS = [
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/products', label: 'Products', icon: ShoppingBag },
  { to: '/ads', label: 'Ads', icon: Megaphone },
  { to: '/config', label: 'Config', icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const nav = useNavigate();
  const [logoOk, setLogoOk] = useState(true);

  return (
    <aside className="w-64 h-full shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-100">
        {logoOk ? (
          <img
            src="/logo_1024.png"
            alt="Dream"
            className="w-10 h-10 rounded-xl shadow-sm"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center font-extrabold">
            D
          </div>
        )}
        <div className="leading-tight">
          <div className="font-extrabold tracking-tight text-slate-900">
            Dream
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-brand">
            Admin Console
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-accent" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => {
            setToken('');
            onNavigate?.();
            nav('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
