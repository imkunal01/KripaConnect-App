import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function About() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': 'https://kripaconnect.in/about#aboutpage',
        url: 'https://kripaconnect.in/about',
        name: 'About KripaConnect',
        description: 'Connecting quality electronics and appliances with seamless modern commerce in India.',
        mainEntity: {
          '@type': 'Organization',
          name: 'KripaConnect',
          url: 'https://kripaconnect.in/',
          logo: 'https://kripaconnect.in/icon-512.png',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://kripaconnect.in/about#breadcrumb',
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
            name: 'About Us',
            item: 'https://kripaconnect.in/about',
          },
        ],
      },
    ],
  }

  return (
    <div className="static-page">
      <SEO
        title="About Us | Our Mission & Commerce Platform | KripaConnect"
        description="Learn about KripaConnect, your trusted destination for quality electronics, transparent pricing, fast logistics, and dependable B2B & B2C commerce in India."
        canonical="/about"
        schema={aboutSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">About KripaConnect</h1>
          <p className="hero-lead">Connecting quality products with seamless modern commerce.</p>
        </section>

        <section className="section grid-two" aria-label="Our core mission and values">
          <div className="card">
            <h2 className="section-title">Our Mission</h2>
            <p className="muted">Deliver a smooth shopping experience with reliable logistics, secure payments, and curated selections.</p>
          </div>
          <div className="card">
            <h2 className="section-title">What We Value</h2>
            <div className="list">
              <span>Customer trust</span>
              <span>Transparent pricing</span>
              <span>Responsive support</span>
              <span>Continuous improvement</span>
            </div>
          </div>
        </section>

        <section className="section" aria-label="Platform highlights">
          <h2 className="section-title">Highlights</h2>
          <div className="grid-two">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Secure Checkout</h3>
              <p className="muted">Best-in-class security across the full payment flow.</p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Fast Fulfillment</h3>
              <p className="muted">Real-time order tracking and dependable delivery partners.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
