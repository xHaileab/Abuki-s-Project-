import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthed } from './auth.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import AdsPage from './pages/AdsPage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      >
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="ads" element={<AdsPage />} />
        <Route path="config" element={<ConfigPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
