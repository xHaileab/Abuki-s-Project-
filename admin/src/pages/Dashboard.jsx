import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

export default function Dashboard() {
  return (
    <div className="h-full flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
