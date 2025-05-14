import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Páginas públicas
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Páginas que requerem autenticação
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Páginas de admin
import AdminProductsPage from './pages/admin/ProductsPage';
import AdminProductEditPage from './pages/admin/ProductEditPage';
import AdminCouponsPage from './pages/admin/CouponsPage';
import AdminCouponEditPage from './pages/admin/CouponEditPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminOrderDetailPage from './pages/admin/OrderDetailPage';

// Componente de Rota Protegida (requer autenticação)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Componente de Rota para Admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success/:id" element={<OrderSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rotas protegidas (requer autenticação) */}
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute>
                <OrdersPage />
              </PrivateRoute>
            } />
            <Route path="/orders/:id" element={
              <PrivateRoute>
                <OrderDetailPage />
              </PrivateRoute>
            } />
            
            {/* Rotas de administração */}
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            } />
            <Route path="/admin/products/create" element={
              <AdminRoute>
                <AdminProductEditPage />
              </AdminRoute>
            } />
            <Route path="/admin/products/:id/edit" element={
              <AdminRoute>
                <AdminProductEditPage />
              </AdminRoute>
            } />
            <Route path="/admin/coupons" element={
              <AdminRoute>
                <AdminCouponsPage />
              </AdminRoute>
            } />
            <Route path="/admin/coupons/create" element={
              <AdminRoute>
                <AdminCouponEditPage />
              </AdminRoute>
            } />
            <Route path="/admin/coupons/:id/edit" element={
              <AdminRoute>
                <AdminCouponEditPage />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <AdminRoute>
                <AdminOrderDetailPage />
              </AdminRoute>
            } />
            
            {/* Rota 404 - Página não encontrada */}
            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;