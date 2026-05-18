import { NavLink, useNavigate } from 'react-router-dom';
import { setToken } from '../auth.js';

const ITEMS = [
  { to: '/orders', label: 'Orders', icon: '📦' },
  { to: '/products', label: 'Products', icon: '🛒' },
  { to: '/ads', label: 'Ads', icon: '📣' },
  { to: '/config', label: 'Config', icon: '⚙️' },
];

export default function Sidebar() {
  const nav = useNavigate();
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center font-extrabold">
          D
        </div>
        <div>
          <div className="font-extrabold tracking-tight">Dream</div>
          <div className="text-xs text-slate-500 -mt-0.5">Admin</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-brand text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <span>{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => {
          setToken('');
          nav('/login');
        }}
        className="m-3 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 text-left"
      >
        Sign out
      </button>
    </aside>
  );
}
