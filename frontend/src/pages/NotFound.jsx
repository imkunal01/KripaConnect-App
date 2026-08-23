import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function NotFound() {
  return (
    <div className="static-page">
      <SEO
        title="Page Not Found (404) | KripaConnect"
        description="The page you are looking for does not exist on KripaConnect."
        robots="noindex, nofollow"
      />
      <Navbar />
      <main className="page-main notfound">
        <h1>404</h1>
        <p>Page not found. The link might be broken or moved.</p>
        <div className="cta-row" style={{ justifyContent: 'center' }}>
          <Link className="btn primary" to="/">Go Home</Link>
          <Link className="btn" to="/products">Browse Products</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
