import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Privacy() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'Privacy policy for KripaConnect regarding data handling, third-party disclosures, and compliance with data protection laws.',
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
        description="Read the KripaConnect Privacy Policy to learn how we collect, protect, and manage your personal data, payments, and account information securely."
        canonical="/privacy"
        schema={privacySchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Privacy Policy</h1>
          <p className="hero-lead">
            Last Updated: September 2026. At KripaConnect Electronics &amp; Appliances, we prioritize transparency, data protection, and user confidentiality across our retail and B2B wholesale platform.
          </p>
        </section>

        {/* 1. Introduction & Applicability */}
        <section className="section" aria-label="Introduction and applicability">
          <h2 className="section-title">1. Introduction &amp; Applicability</h2>
          <p>
            This Privacy Policy describes how KripaConnect (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), headquartered in Indore, Madhya Pradesh, India, collects, processes, stores, and safeguards personal data when you visit our website (<strong>kripaconnect.in</strong>), use our Android application, or transact through our retail and wholesale portals.
          </p>
          <p>
            We adhere to the provisions of the Information Technology Act, 2000, Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection (DPDP) Act, 2023.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="section" aria-label="Information collection policy">
          <h2 className="section-title">2. Information We Collect</h2>
          <p>We collect only the data necessary to provide seamless shopping and logistics:</p>
          <div className="list">
            <span><strong>Identity &amp; Contact:</strong> Full name, verified email address, and mobile phone number for authentication and OTP verification.</span>
            <span><strong>Delivery &amp; Logistics:</strong> Shipping address, landmark, city, state, and pincode required for dispatch and physical doorstep delivery.</span>
            <span><strong>B2B Verification Data:</strong> For wholesale partner registrations, business name, GSTIN (optional/applicable), and commercial premises address.</span>
            <span><strong>Transaction Records:</strong> Order identifiers, itemized invoices, payment status, and order history. Note: We do NOT store sensitive card numbers or CVVs on our servers.</span>
            <span><strong>Technical &amp; Session Logs:</strong> IP address, device type, browser metadata, and essential authentication session tokens.</span>
          </div>
        </section>

        {/* 3. Purpose & Legal Basis */}
        <section className="section" aria-label="Data usage policy">
          <h2 className="section-title">3. How We Use Your Information</h2>
          <div className="list">
            <span><strong>Order Fulfillment:</strong> To process, pack, invoice, and deliver consumer electronics and appliances to your doorstep.</span>
            <span><strong>Customer Service &amp; Tracking:</strong> To send real-time order tracking updates, dispatch notices, and support inquiries via email and SMS/WhatsApp.</span>
            <span><strong>Fraud Prevention &amp; Security:</strong> To detect unauthorized access, protect user accounts, and prevent transaction fraud.</span>
            <span><strong>Statutory Compliance:</strong> To maintain required sales records and GST invoices as mandated by Indian tax laws.</span>
          </div>
        </section>

        {/* 4. Third-Party Service Providers */}
        <section className="section" aria-label="Third-party service providers">
          <h2 className="section-title">4. Third-Party Service Providers &amp; Disclosures</h2>
          <p>
            We only share data with vetted third-party technology providers strictly required to operate our core services. We never sell or rent your personal information to data brokers or advertising networks.
          </p>
          <div className="list">
            <span><strong>Razorpay (Payment Gateway):</strong> When you choose online payment, transaction handling is managed securely by Razorpay Software Private Limited under PCI-DSS Level 1 certification. Financial credentials are encrypted and tokenized directly by Razorpay.</span>
            <span><strong>Google Maps Platform:</strong> Used solely to assist users with delivery address autocomplete and locality geocoding in the address form.</span>
            <span><strong>Google Fonts &amp; Cloud CDN:</strong> Used to reliably deliver web fonts and product media assets across fast regional content delivery networks.</span>
            <span><strong>Logistics &amp; Courier Partners:</strong> Delivery details (name, address, contact phone) are shared with assigned logistics personnel for physical parcel dispatch.</span>
          </div>
        </section>

        {/* 5. Cookies & Local Storage */}
        <section className="section" aria-label="Cookies and local storage policy">
          <h2 className="section-title">5. Cookies &amp; Local Storage</h2>
          <p>
            KripaConnect uses browser LocalStorage and essential session tokens strictly for functional purposes:
          </p>
          <div className="list">
            <span><strong>Authentication Tokens:</strong> Secure JWT tokens to keep you logged in across browser sessions.</span>
            <span><strong>Cart &amp; Preferences:</strong> To remember your selected items, purchase mode (Customer vs. Retailer B2B), and saved wishlist items.</span>
            <span><strong>No Invasive Tracking:</strong> We do not deploy third-party cross-site advertising trackers or behavioural profiling cookies.</span>
          </div>
        </section>

        {/* 6. Data Security & Retention */}
        <section className="section" aria-label="Data security and retention">
          <h2 className="section-title">6. Data Security &amp; Retention</h2>
          <p>
            We implement 256-bit SSL/TLS end-to-end encryption in transit and strict role-based access control on our databases. Passwords are cryptographically hashed using salted bcrypt.
          </p>
          <p>
            Personal data is retained only as long as your account remains active or as required by applicable Indian tax and consumer protection regulations for warranty and financial auditing.
          </p>
        </section>

        {/* 7. Your Legal Rights */}
        <section className="section" aria-label="User rights and controls">
          <h2 className="section-title">7. Your Rights &amp; Controls</h2>
          <p>Under the Digital Personal Data Protection Act, you have the right to:</p>
          <div className="list">
            <span><strong>Access &amp; Review:</strong> View and update your profile details and saved delivery addresses at any time in Account Settings.</span>
            <span><strong>Correction &amp; Erasure:</strong> Request correction of inaccurate information or deletion of your personal account data, subject to statutory order retention requirements.</span>
            <span><strong>Withdraw Consent:</strong> Revoke consent for promotional communications or close your account by contacting our support desk.</span>
          </div>
        </section>

        {/* 8. Grievance Redressal */}
        <section className="section" aria-label="Grievance officer details">
          <h2 className="section-title">8. Grievance Officer &amp; Inquiries</h2>
          <p>
            In accordance with the Information Technology Act, 2000 and Consumer Protection (E-Commerce) Rules, 2020, our designated Grievance Officer can be contacted for any privacy concerns:
          </p>
          <div className="card" style={{ padding: '20px', marginTop: '12px' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Officer Designation:</strong> Grievance &amp; Compliance Officer</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Platform:</strong> KripaConnect Electronics &amp; Appliances</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>support@kripaconnect.in</a></p>
            <p style={{ margin: 0 }}><strong>Registered Location:</strong> Indore, Madhya Pradesh - 452001, India</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
