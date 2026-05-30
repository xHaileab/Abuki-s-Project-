import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthed } from './auth.js';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'));
const AdsPage = lazy(() => import('./pages/AdsPage.jsx'));
const ConfigPage = lazy(() => import('./pages/ConfigPage.jsx'));

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function PageFallback() {
  return (
    <div className="min-h-screen grid place-items-center text-sm text-slate-500">
      Loading...
    </div>
  );
}

function lazyPage(element) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={lazyPage(<Login />)} />
      <Route
        path="/"
        element={
          <Protected>
            {lazyPage(<Dashboard />)}
          </Protected>
        }
      >
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={lazyPage(<OrdersPage />)} />
        <Route path="products" element={lazyPage(<ProductsPage />)} />
        <Route path="ads" element={lazyPage(<AdsPage />)} />
        <Route path="config" element={lazyPage(<ConfigPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
