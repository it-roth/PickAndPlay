import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';

// Admin Pages
import Dashboard from './pages/Admin/Dashboard';
import ProductList from './pages/Admin/ProductList';
import AddProduct from './pages/Admin/AddProduct';
import EditProduct from './pages/Admin/EditProduct';
import Orders from './pages/Admin/Orders';
import Users from './pages/Admin/Users';

// Not Found Page
import NotFound from './pages/NotFound';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated and has admin role
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      
      // In a real app, you would verify the token and get user info
      // For now, we'll just check if a special admin token is set
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setIsAdmin(user.role === 'ADMIN');
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
  }, []);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 position-relative">
        <Navbar />
        
        <main className="flex-grow-1 main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            
            {/* Admin routes (protected) */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute adminOnly={true}>
                <ProductList />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/add" element={
              <ProtectedRoute adminOnly={true}>
                <AddProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/edit/:id" element={
              <ProtectedRoute adminOnly={true}>
                <EditProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute adminOnly={true}>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <Users />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App
