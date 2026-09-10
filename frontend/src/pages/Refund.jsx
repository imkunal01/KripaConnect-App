import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Refund() {
  const refundSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Refund & Cancellation Policy',
    description: 'Return, replacement, order cancellation, and refund policies for KripaConnect purchases.',
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
          name: 'Refund & Cancellation Policy',
          item: 'https://kripaconnect.in/returns',
        },
      ],
    },
  }

  return (
    <div className="static-page">
      <SEO
        title="Refund & Cancellation Policy | Easy Returns & Timelines | KripaConnect"
        description="Learn about KripaConnect order cancellation rules, 7-day return eligibility, replacement process, and fast 5-7 day refund processing."
        canonical="/returns"
        schema={refundSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Refund &amp; Cancellation Policy</h1>
          <p className="hero-lead">
            Last Updated: September 2026. At KripaConnect, we aim for complete customer satisfaction. Review our straightforward guidelines for order cancellations, replacements, and refund processing.
          </p>
        </section>

        {/* 1. Order Cancellation Policy */}
        <section className="section" aria-label="Order cancellation policy">
          <h2 className="section-title">1. Order Cancellation Policy</h2>
          <p>
            We understand plans change. We provide hassle-free cancellation options before parcels leave our distribution center:
          </p>
          <div className="list">
            <span><strong>Cancellation Before Dispatch:</strong> You can cancel any order free of charge at any time prior to warehouse dispatch directly from the <strong>My Orders</strong> page or by reaching our support desk.</span>
            <span><strong>Prepaid Order Cancellations:</strong> If you cancel an order paid online via Razorpay (UPI, Card, Net Banking), a 100% full refund is immediately initiated back to your original source payment method.</span>
            <span><strong>Cash on Delivery (COD) Cancellations:</strong> COD orders can be cancelled before dispatch at zero fee with no penalty.</span>
            <span><strong>Post-Dispatch Cancellations:</strong> Once an order is handed over to our delivery logistics partner, it cannot be cancelled mid-transit. You may simply decline delivery when the courier arrives or initiate a return within 7 days of receipt.</span>
          </div>
        </section>

        {/* 2. 7-Day Easy Return & Replacement Policy */}
        <section className="section" aria-label="7-Day Return and replacement eligibility">
          <h2 className="section-title">2. 7-Day Return &amp; Replacement Guarantee</h2>
          <p>
            All electronic items, consumer appliances, and hardware bought on KripaConnect are eligible for replacement or return within <strong>7 days</strong> of delivery under the following conditions:
          </p>
          <div className="list">
            <span><strong>Transit Damage or Defect:</strong> Item arrived damaged, dented, or dead on arrival (DOA).</span>
            <span><strong>Incorrect Item Received:</strong> Product model, color, or specifications differ from your confirmed order.</span>
            <span><strong>Missing Accessories:</strong> Cables, remote controls, user manuals, or mounting brackets missing from the sealed box.</span>
            <span><strong>Item Condition:</strong> The item must be unused, in its original brand box with all tags, serial number barcode stickers, warranty cards, and accessories intact.</span>
          </div>
        </section>

        {/* 3. Return Procedure */}
        <section className="section" aria-label="Return and replacement procedure">
          <h2 className="section-title">3. How to Initiate a Return</h2>
          <div className="list">
            <span><strong>Step 1 - Submit Request:</strong> Go to <strong>My Orders</strong>, select the relevant order, and click &quot;Request Return / Replacement&quot;, or email <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D' }}>support@kripaconnect.in</a> with your Order ID and photos/video showing the issue.</span>
            <span><strong>Step 2 - Verification:</strong> Our support desk reviews the details within 24 business hours.</span>
            <span><strong>Step 3 - Free Doorstep Pickup:</strong> A pickup agent will visit your registered address to collect the product.</span>
            <span><strong>Step 4 - Quality Inspection:</strong> Once the parcel arrives back at our regional hub, our technicians verify the defect or condition.</span>
          </div>
        </section>

        {/* 4. Refund Methods & Timelines */}
        <section className="section" aria-label="Refund processing and timelines">
          <h2 className="section-title">4. Refund Methods &amp; Processing Timelines</h2>
          <p>
            Once a return inspection is approved, refunds are processed promptly:
          </p>
          <div className="list">
            <span><strong>Prepaid Orders (UPI / Cards / Net Banking):</strong> Transferred back to the original source account via Razorpay within <strong>5–7 business days</strong>.</span>
            <span><strong>Cash on Delivery (COD) Orders:</strong> Our team will securely request your preferred UPI ID or Bank Account (NEFT/IMPS) details. Funds are transferred within <strong>3–5 business days</strong> of approval.</span>
            <span><strong>Instant Replacement Option:</strong> Customers may choose an immediate free product replacement instead of a refund, dispatched with priority tracking.</span>
          </div>
        </section>

        {/* 5. OEM Brand Warranty Support */}
        <section className="section" aria-label="Manufacturer warranty assistance">
          <h2 className="section-title">5. Beyond 7 Days: OEM Brand Warranty</h2>
          <p>
            For any technical faults or maintenance after the 7-day KripaConnect return window, products remain fully covered under the official manufacturer warranty. You can visit any authorized brand service center across India with your KripaConnect digital invoice.
          </p>
          <p>
            For assistance with returns or warranty guidance, contact our team at <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>support@kripaconnect.in</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
