import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles/App.css';

// Hooks
import { useAuth } from '../contexts/AuthContext';

// Components
import { Navbar, Footer, ProtectedRoute, AdminLayout } from '../components';

// Public Pages
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import ProductDetails from '../pages/ProductDetails';
import Categories from '../pages/Categories';
import Contact from '../pages/Contact';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import Register from '../pages/Register';
import About from '../pages/About';
import ScrollToTop from '../components/ScrollToTop';
import OrderConfirmation from '../pages/OrderConfirmation';
import Profile from '../pages/Profile';

// Admin Pages
import Dashboard from '../pages/Admin/Dashboard';
import ProductList from '../pages/Admin/ProductList';
import AddProduct from '../pages/Admin/AddProduct';
import EditProduct from '../pages/Admin/EditProduct';
import Users from '../pages/Admin/Users';
import Orders from '../pages/Admin/Orders';

// Not Found Page
import NotFound from '../pages/NotFound';

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth pages - render without Navbar/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public routes with navbar and footer */}
        <Route path="/*" element={
          <div className="d-flex flex-column min-vh-100 position-relative">
            <Navbar />
            <main className="flex-grow-1 main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:name" element={<Categories />} />
                <Route path="/category/:categoryName" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />

        {/* Admin routes with AdminLayout (no navbar/footer) */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/add" element={<AddProduct />} />
                <Route path="/products/edit/:id" element={<EditProduct />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/users" element={<Users />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App
