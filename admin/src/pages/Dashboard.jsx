import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

const TITLES = {
  '/orders': 'Orders',
  '/products': 'Products',
  '/ads': 'Ads',
  '/config': 'Config',
};

export default function Dashboard() {
  const { pathname } = useLocation();
  const current =
    Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ||
    'Dashboard';

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
          <div className="text-sm text-slate-400">
            <span className="text-slate-500 font-medium">Dream</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">{current}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
