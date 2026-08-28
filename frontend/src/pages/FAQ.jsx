import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function FAQ() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': 'https://kripaconnect.in/faq#faqpage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I track my order?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Go to Orders from your profile to view live status and delivery details in real-time.',
            },
          },
          {
            '@type': 'Question',
            name: 'What payment methods are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We support secure online payments (UPI, Credit/Debit Cards, Net Banking) via Razorpay and Cash on Delivery.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can retailers place bulk orders?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Registered retail partners can access wholesale pricing and bulk reordering through the KripaConnect B2B portal.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do returns and refunds work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Unused products in original packaging can be returned within the return window. Visit the Refund Policy page for step-by-step instructions.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://kripaconnect.in/faq#breadcrumb',
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
            name: 'FAQ',
            item: 'https://kripaconnect.in/faq',
          },
        ],
      },
    ],
  }

  return (
    <div className="static-page">
      <SEO
        title="Frequently Asked Questions (FAQ) | Orders & Support | KripaConnect"
        description="Find answers to frequently asked questions about ordering, payments, B2B wholesale, returns, tracking, and delivery at KripaConnect."
        canonical="/faq"
        schema={faqSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Frequently Asked Questions</h1>
          <p className="hero-lead">Quick answers to common questions about shopping and orders.</p>
        </section>
        <section className="section" aria-label="Questions and answers list">
          <div className="faq-item">
            <h2 className="faq-q" style={{ fontSize: '1.1rem', margin: 0 }}>How do I track my order?</h2>
            <div className="faq-a">Go to Orders from your profile to view live status and details.</div>
          </div>
          <div className="faq-item">
            <h2 className="faq-q" style={{ fontSize: '1.1rem', margin: 0 }}>What payment methods are supported?</h2>
            <div className="faq-a">We support secure online payments through the integrated gateway.</div>
          </div>
          <div className="faq-item">
            <h2 className="faq-q" style={{ fontSize: '1.1rem', margin: 0 }}>Can retailers place bulk orders?</h2>
            <div className="faq-a">Retail partners can access special pricing via the B2B portal.</div>
          </div>
          <div className="faq-item">
            <h2 className="faq-q" style={{ fontSize: '1.1rem', margin: 0 }}>How do returns and refunds work?</h2>
            <div className="faq-a">View the Refund Policy for timelines, eligibility, and initiation steps.</div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
