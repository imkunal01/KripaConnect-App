import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Categories = lazy(() => import('./pages/Categories.jsx'))
const B2B = lazy(() => import('./pages/B2B.jsx'))
const Favorites = lazy(() => import('./pages/Favorites.jsx'))
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'))
const SuccessScreen = lazy(() => import('./pages/SuccessScreen.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const AddressSetupPage = lazy(() => import('./pages/AddressSetupPage.jsx'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx'))
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'))
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const FAQ = lazy(() => import('./pages/FAQ.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Refund = lazy(() => import('./pages/Refund.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

const AppFallback = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f7f7' }}>
    <div style={{ padding: '1.5rem 2rem', borderRadius: '12px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', border: '4px solid #d0d8e0', borderTopColor: '#eb2525ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Rukiye Jaraa...</div>
      <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>Bass Ho hi Gya...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

function App() {
  return (
    <Suspense fallback={<AppFallback />}>
      <div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/success/:orderId" element={<SuccessScreen />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/address-setup" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
          <Route path="/b2b" element={<ProtectedRoute allow={['retailer']}><B2B /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<ProtectedRoute allow={['admin']}><Admin /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/returns" element={<Refund />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Suspense>
  )
}

export default App
