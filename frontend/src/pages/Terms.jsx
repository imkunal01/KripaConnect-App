import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Terms() {
  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions',
    description: 'Terms of service and purchasing conditions on KripaConnect.',
    url: 'https://kripaconnect.in/terms',
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
          name: 'Terms & Conditions',
          item: 'https://kripaconnect.in/terms',
        },
      ],
    },
  }

  return (
    <div className="static-page">
      <SEO
        title="Terms & Conditions | Platform Usage Guidelines | KripaConnect"
        description="Review the Terms and Conditions governing your use of KripaConnect services, ordering rules, customer accounts, and warranties."
        canonical="/terms"
        schema={termsSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Terms & Conditions</h1>
          <p className="hero-lead">Please review the terms governing use of KripaConnect.</p>
        </section>
        <section className="section" aria-label="Service terms">
          <h2 className="section-title">Use of Service</h2>
          <div className="list">
            <span>Maintain accurate account information</span>
            <span>Comply with applicable laws and policies</span>
            <span>Respect intellectual property rights</span>
          </div>
        </section>
        <section className="section" aria-label="Ordering policies">
          <h2 className="section-title">Orders & Purchases</h2>
          <div className="list">
            <span>Orders are subject to availability and confirmation</span>
            <span>Pricing may update based on promotions or stock</span>
            <span>We reserve the right to cancel due to errors or risk</span>
          </div>
        </section>
        <section className="section" aria-label="Liability limitations">
          <h2 className="section-title">Liability & Warranties</h2>
          <div className="list">
            <span>Service provided on an as-available basis</span>
            <span>Limitations apply to indirect or consequential losses</span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
