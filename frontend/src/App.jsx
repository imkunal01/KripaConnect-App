import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
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
  <div className="app-fallback" role="status" aria-live="polite" aria-busy="true">
    <div className="app-fallback__card">
      <div className="app-fallback__mark" aria-hidden="true">
        <div className="app-fallback__spinner" />
      </div>
      <div className="app-fallback__title">Wait a moment…</div>
      <div className="app-fallback__subtitle">Loading</div>
      <div className="app-fallback__bar" aria-hidden="true">
        <div className="app-fallback__barFill" />
      </div>
    </div>
  </div>
)

function App() {
  return (
    <Suspense fallback={<AppFallback />}>
      <div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
