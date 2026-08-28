import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Services() {
  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Products & Services',
    description: 'Explore KripaConnect retail electronics catalog, wholesale B2B platform, and support services.',
    url: 'https://kripaconnect.in/services',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://kripaconnect.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
          item: 'https://kripaconnect.in/services',
        },
      ],
    },
  }

  return (
    <div className="static-page">
      <SEO
        title="Products & Services | Retail & B2B Solutions | KripaConnect"
        description="Discover KripaConnect offerings including curated consumer electronics, wholesale B2B ordering, secure checkout, and post-purchase care."
        canonical="/services"
        schema={servicesSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Products & Services</h1>
          <p className="hero-lead">From retail-ready products to B2B bulk ordering and post-purchase care.</p>
        </section>
        <section className="section grid-two" aria-label="Services offerings">
          <div className="card">
            <h2 className="section-title">Product Catalog</h2>
            <p className="muted">Explore categories, search, filter, and favorite items tailored to your needs.</p>
            <div className="cta-row">
              <Link className="btn primary" to="/products">Browse Products</Link>
              <Link className="btn" to="/categories">View Categories</Link>
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">B2B Services</h2>
            <p className="muted">Bulk pricing, retailer portal, and streamlined order management for partners.</p>
            <div className="cta-row">
              <Link className="btn" to="/b2b">Open B2B Portal</Link>
            </div>
          </div>
        </section>
        <section className="section grid-two" aria-label="Service benefits">
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Secure Payments</h3>
            <p className="muted">Integrated payment gateway with server-side verification options.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Post-Purchase Support</h3>
            <p className="muted">Order tracking, returns, and responsive customer service.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
