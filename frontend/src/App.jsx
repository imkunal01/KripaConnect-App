import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Admin from './pages/Admin.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import B2B from './pages/B2B.jsx'
import Favorites from './pages/Favorites.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import SuccessScreen from './pages/SuccessScreen.jsx'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success/:orderId" element={<SuccessScreen />} />
        <Route path="/b2b" element={<ProtectedRoute allow={['retailer']}><B2B /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<ProtectedRoute allow={['admin']}><Admin /></ProtectedRoute>} />
        {/* Redirect legacy /dashboard to / for now, or keep it as an alias */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<div style={{ padding: 24 }}>About Kripa Connect</div>} />
        <Route path="/contact" element={<div style={{ padding: 24 }}>Contact us at support@kripaconnect.example</div>} />
        <Route path="/policy" element={<div style={{ padding: 24 }}>Privacy & Terms</div>} />
      </Routes>
    </div>
  )
}

export default App
