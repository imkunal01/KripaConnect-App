import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Contact() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': 'https://kripaconnect.in/contact#contactpage',
        url: 'https://kripaconnect.in/contact',
        name: 'Contact KripaConnect',
        description: 'Customer support, order inquiries, and wholesale partnership contact details.',
        mainEntity: {
          '@type': 'Organization',
          name: 'KripaConnect',
          url: 'https://kripaconnect.in/',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'support@kripaconnect.in',
              availableLanguage: ['English', 'Hindi'],
            },
            {
              '@type': 'ContactPoint',
              contactType: 'sales & partnerships',
              email: 'partners@kripaconnect.in',
              availableLanguage: ['English', 'Hindi'],
            },
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://kripaconnect.in/contact#breadcrumb',
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
            name: 'Contact Us',
            item: 'https://kripaconnect.in/contact',
          },
        ],
      },
    ],
  }

  return (
    <div className="static-page">
      <SEO
        title="Contact Us | Customer Support & Business Partnerships | KripaConnect"
        description="Get in touch with KripaConnect support for orders, product inquiries, or retailer partnerships. Email us at support@kripaconnect.in."
        canonical="/contact"
        schema={contactSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Contact Us</h1>
          <p className="hero-lead">We are here to help with orders, products, and partnerships.</p>
        </section>
        <section className="section grid-two" aria-label="Contact channels">
          <div className="card">
            <h2 className="section-title">Support</h2>
            <div className="list">
              <span>Email: <a href="mailto:support@kripaconnect.in" style={{ color: 'inherit' }}>support@kripaconnect.in</a></span>
              <span>Hours: Mon–Sat, 9am–6pm IST</span>
            </div>
          </div>
          <div className="card">
            <h2 className="section-title">Partnerships</h2>
            <div className="list">
              <span>Email: <a href="mailto:partners@kripaconnect.in" style={{ color: 'inherit' }}>partners@kripaconnect.in</a></span>
              <span>For retailers and B2B collaboration</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
