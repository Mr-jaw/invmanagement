import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/admin/AdminLayout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Products as AdminProducts } from './pages/admin/Products';
import { ProductForm } from './pages/admin/ProductForm';
import { Categories } from './pages/admin/Categories';
import { Reviews } from './pages/admin/Reviews';
import { Contacts } from './pages/admin/Contacts';
import { Analytics } from './pages/admin/Analytics';
import { Inventory } from './pages/admin/Inventory';
import { Subscribers } from './pages/admin/Subscribers';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/*" element={<AdminLayout />}>
              {/* Default admin route redirects to dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="categories" element={<Categories />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            {/* Public Routes */}
            <Route path="/*" element={
              <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;