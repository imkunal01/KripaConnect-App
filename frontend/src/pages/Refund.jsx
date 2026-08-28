import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Refund() {
  const refundSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Refund & Returns Policy',
    description: 'Return, replacement, and refund policies for KripaConnect purchases.',
    url: 'https://kripaconnect.in/returns',
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
          name: 'Refund Policy',
          item: 'https://kripaconnect.in/returns',
        },
      ],
    },
  }

  return (
    <div className="static-page">
      <SEO
        title="Refund & Return Policy | Easy Returns & Timelines | KripaConnect"
        description="Learn about KripaConnect return eligibility, step-by-step return process, inspection, and refund processing timelines."
        canonical="/returns"
        schema={refundSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Refund Policy</h1>
          <p className="hero-lead">Understand eligibility, timelines, and how to start a return.</p>
        </section>
        <section className="section" aria-label="Return eligibility">
          <h2 className="section-title">Eligibility</h2>
          <div className="list">
            <span>Items must be unused and in original condition</span>
            <span>Include packaging and proof of purchase</span>
            <span>Report issues within the stated window</span>
          </div>
        </section>
        <section className="section" aria-label="Return process">
          <h2 className="section-title">Process</h2>
          <div className="list">
            <span>Submit a request via Orders or Support</span>
            <span>Receive instructions and shipping label if applicable</span>
            <span>Refunds issued after inspection and approval</span>
          </div>
        </section>
        <section className="section" aria-label="Refund timelines">
          <h2 className="section-title">Timelines</h2>
          <div className="list">
            <span>Processing usually completes within 7–10 business days</span>
            <span>Payment reversals depend on your bank or provider</span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
