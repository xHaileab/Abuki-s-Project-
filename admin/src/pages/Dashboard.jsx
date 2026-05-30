import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';

const TITLES = {
  '/orders': 'Orders',
  '/products': 'Products',
  '/ads': 'Ads',
  '/config': 'Config',
};

export default function Dashboard() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current =
    Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ||
    'Dashboard';

  return (
    <div className="h-full flex">
      {/* Static sidebar on desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Slide-in drawer on mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-soft animate-fade-in">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center gap-2 px-4 sm:px-6 sticky top-0 z-10">
          <button
            className="md:hidden inline-grid place-items-center w-9 h-9 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-slate-400">
            <span className="text-slate-500 font-medium">Dream</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">{current}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
