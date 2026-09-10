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
        description="Review the Terms and Conditions governing your use of KripaConnect retail and B2B wholesale services, ordering rules, accounts, and warranties."
        canonical="/terms"
        schema={termsSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Terms &amp; Conditions</h1>
          <p className="hero-lead">
            Last Updated: September 2026. Please read these terms carefully before accessing or purchasing through KripaConnect Electronics &amp; Appliances.
          </p>
        </section>

        {/* 1. Agreement & Acceptance */}
        <section className="section" aria-label="Agreement and acceptance">
          <h2 className="section-title">1. Acceptance of Terms</h2>
          <p>
            By creating an account, browsing our catalog, or placing an order on <strong>kripaconnect.in</strong> or the KripaConnect mobile application, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;), along with our Privacy Policy and Refund &amp; Cancellation Policy. If you do not agree, please discontinue using the platform immediately.
          </p>
          <p>
            You must be at least 18 years of age and competent to enter into a legally binding contract under the Indian Contract Act, 1872.
          </p>
        </section>

        {/* 2. Account Security & Verification */}
        <section className="section" aria-label="Account security and verification">
          <h2 className="section-title">2. Account Registration &amp; Security</h2>
          <div className="list">
            <span><strong>Accurate Information:</strong> You agree to provide true, accurate, and current contact details, shipping addresses, and identification during registration.</span>
            <span><strong>Credential Confidentiality:</strong> You are responsible for maintaining the confidentiality of your login password, OTPs, and account session tokens.</span>
            <span><strong>Account Suspension:</strong> We reserve the right to suspend or terminate accounts that engage in fraudulent activities, fake ordering, or abuse of platform features.</span>
          </div>
        </section>

        {/* 3. Catalog, Pricing & Stock Availability */}
        <section className="section" aria-label="Catalog, pricing and stock">
          <h2 className="section-title">3. Products, Pricing &amp; Availability</h2>
          <p>
            All product specifications, images, and dimensions are displayed as accurately as provided by authorized OEM manufacturers and brand partners.
          </p>
          <div className="list">
            <span><strong>Prices in INR:</strong> All prices are quoted in Indian Rupees (₹). Prices include applicable GST unless explicitly indicated otherwise on B2B invoices.</span>
            <span><strong>Inventory &amp; Stock:</strong> Orders are subject to real-time warehouse inventory availability. Items displayed as in-stock are dispatched on a first-confirmed basis.</span>
            <span><strong>Pricing Errors:</strong> In the rare event of a typographical or clerical error in pricing or stock listing, KripaConnect reserves the right to cancel affected orders and issue a prompt 100% refund.</span>
          </div>
        </section>

        {/* 4. Wholesale & Retailer B2B Specifics */}
        <section className="section" aria-label="B2B Wholesale terms">
          <h2 className="section-title">4. Retailer B2B Wholesale Portal</h2>
          <p>
            Retailers and trade partners accessing wholesale pricing agree to additional commercial guidelines:
          </p>
          <div className="list">
            <span><strong>Minimum Order Quantities (MOQ):</strong> Bulk wholesale rates apply exclusively when order volume meets or exceeds the specified per-SKU MOQ.</span>
            <span><strong>Business Invoicing:</strong> Tax invoices with valid GSTIN are issued for verified commercial retailers for legitimate input tax credit (ITC) claims.</span>
            <span><strong>Commercial Resale:</strong> Retailers are responsible for adhering to local sales regulations, MRP compliance, and authorized retail practices.</span>
          </div>
        </section>

        {/* 5. Payments & Invoicing */}
        <section className="section" aria-label="Payments and transactions">
          <h2 className="section-title">5. Payments &amp; Invoicing</h2>
          <p>
            We offer secure digital payments and Cash on Delivery (where serviceability permits):
          </p>
          <div className="list">
            <span><strong>Online Transactions:</strong> Processed through PCI-DSS certified gateway partner Razorpay (UPI, Credit/Debit Cards, Net Banking, and Wallet providers).</span>
            <span><strong>Cash on Delivery (COD):</strong> Payment must be tendered in full to the delivery partner upon arrival before package handover.</span>
            <span><strong>Invoice Delivery:</strong> Digital invoices are generated and accessible under the My Orders dashboard immediately following checkout confirmation.</span>
          </div>
        </section>

        {/* 6. Brand Warranties & OEM Guarantees */}
        <section className="section" aria-label="Warranties and OEM guarantees">
          <h2 className="section-title">6. Brand Warranties &amp; Guarantees</h2>
          <p>
            All electronic items, smart TVs, kitchen appliances, and electrical equipment sold on KripaConnect are 100% genuine products sourced directly from authorized OEM distributors.
          </p>
          <div className="list">
            <span><strong>Manufacturer Warranty:</strong> Products carry standard OEM manufacturer warranty coverage against defects as detailed on warranty cards and invoices.</span>
            <span><strong>Service Center Support:</strong> Warranty claims beyond our 7-day initial replacement window can be serviced directly at authorized brand service centers across India.</span>
          </div>
        </section>

        {/* 7. Intellectual Property */}
        <section className="section" aria-label="Intellectual property">
          <h2 className="section-title">7. Intellectual Property Rights</h2>
          <p>
            All logos, branding, platform code, user interface designs, and content on KripaConnect are the intellectual property of KripaConnect or licensed from respective brand partners. Unauthorized scraping, copying, reverse engineering, or commercial reproduction is strictly prohibited.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="section" aria-label="Limitation of liability">
          <h2 className="section-title">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Indian law, KripaConnect shall not be liable for indirect, incidental, punitive, or consequential damages resulting from platform downtime, power fluctuations, or delays caused by third-party logistics or force majeure events.
          </p>
        </section>

        {/* 9. Governing Law & Jurisdiction */}
        <section className="section" aria-label="Governing law and jurisdiction">
          <h2 className="section-title">9. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any legal dispute or claim arising out of these Terms or use of the platform, the courts of <strong>Indore, Madhya Pradesh, India</strong> shall have exclusive jurisdiction.
          </p>
          <p>
            For inquiries regarding these terms, contact us at <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>support@kripaconnect.in</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
