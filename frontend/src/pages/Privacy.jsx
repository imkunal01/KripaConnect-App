import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Privacy() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'Privacy policy for KripaConnect regarding data handling and security.',
    url: 'https://kripaconnect.in/privacy',
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
          name: 'Privacy Policy',
          item: 'https://kripaconnect.in/privacy',
        },
      ],
    },
  }

  return (
    <div className="static-page">
      <SEO
        title="Privacy Policy | Data Protection & Security | KripaConnect"
        description="Read the KripaConnect Privacy Policy to learn how we collect, protect, and manage your personal data and account information securely."
        canonical="/privacy"
        schema={privacySchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Privacy Policy</h1>
          <p className="hero-lead">Your data is handled with care, transparency, and security.</p>
        </section>
        <section className="section" aria-label="Information collection policy">
          <h2 className="section-title">Information We Collect</h2>
          <div className="list">
            <span>Account details and contact information</span>
            <span>Order history and payment confirmation</span>
            <span>Browsing and usage analytics to improve experience</span>
          </div>
        </section>
        <section className="section" aria-label="Data usage policy">
          <h2 className="section-title">How We Use Data</h2>
          <div className="list">
            <span>Process orders and provide customer support</span>
            <span>Detect fraud and keep accounts secure</span>
            <span>Improve products, features, and performance</span>
          </div>
        </section>
        <section className="section" aria-label="User rights and controls">
          <h2 className="section-title">Your Controls</h2>
          <div className="list">
            <span>Access and update your profile data</span>
            <span>Request account deletion and data export</span>
            <span>Manage communication preferences</span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
