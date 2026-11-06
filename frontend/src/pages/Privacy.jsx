import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Privacy() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'Privacy policy for KripaConnect regarding data handling, user consent, third-party disclosures, and compliance with data protection laws.',
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
        description="Read the KripaConnect Privacy Policy to learn how we collect, protect, process, and manage your personal data, payments, and account information securely."
        canonical="/privacy"
        schema={privacySchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Privacy Policy</h1>
          <p className="hero-lead">
            Last Updated: November 2026. At KripaConnect Electronics &amp; Appliances, we prioritize transparency, uncompromising data protection, and user confidentiality across our retail marketplace and B2B wholesale platform.
          </p>
        </section>

        {/* 1. Introduction & Statutory Framework */}
        <section className="section" aria-label="Introduction and legal framework">
          <h2 className="section-title">1. Introduction &amp; Legal Framework</h2>
          <p>
            This Privacy Policy explains how <strong>KripaConnect Electronics &amp; Appliances</strong> (&quot;KripaConnect&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), having its operational headquarters in Indore, Madhya Pradesh, India, collects, uses, stores, transfers, shares, and protects personal data obtained through our website (<strong>kripaconnect.in</strong>), our progressive web app (PWA), Android application, customer support channels, and wholesale partner portals.
          </p>
          <p>
            We operate in strict adherence to applicable Indian and international privacy standards, including:
          </p>
          <div className="list">
            <span>The Information Technology Act, 2000 (and its amendments).</span>
            <span>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules).</span>
            <span>The Digital Personal Data Protection (DPDP) Act, 2023.</span>
            <span>The Consumer Protection (E-Commerce) Rules, 2020.</span>
          </div>
          <p>
            By accessing or transacting on KripaConnect, you expressly consent to the information handling practices described in this policy. If you do not agree with any part of this document, please do not use our services.
          </p>
        </section>

        {/* 2. Categories of Information We Collect */}
        <section className="section" aria-label="Information collection policy">
          <h2 className="section-title">2. Information We Collect</h2>
          <p>
            We only collect personal information that is reasonably necessary to provide an efficient, personalized, and secure shopping experience:
          </p>
          <h3 className="subheading">A. Personal Identification &amp; Contact Details</h3>
          <div className="list">
            <span><strong>Profile Information:</strong> Full name, verified email address, mobile phone number, profile avatar, and preferred communication language.</span>
            <span><strong>Authentication Credentials:</strong> Salted password hashes, session tokens, and one-time passwords (OTPs) used for authentication.</span>
          </div>

          <h3 className="subheading">B. Shipping, Delivery &amp; Geolocation Data</h3>
          <div className="list">
            <span><strong>Delivery Address:</strong> House/flat number, building name, street, nearby landmark, city, state, postal PIN code, and recipient alternate contact number.</span>
            <span><strong>Location Services:</strong> Precise or approximate location data captured when you choose to use geolocation address-autofill or pinpoint delivery routing features.</span>
          </div>

          <h3 className="subheading">C. Commercial &amp; B2B Wholesale Partner Information</h3>
          <div className="list">
            <span><strong>Trade Identity:</strong> Registered commercial business name, trade license name, and store/showroom address.</span>
            <span><strong>Tax Records:</strong> Goods and Services Tax Identification Number (GSTIN) and PAN details for B2B input tax credit (ITC) verification.</span>
            <span><strong>Store Documents:</strong> Optional shop establishment certificate or commercial proof submitted during retailer account verification.</span>
          </div>

          <h3 className="subheading">D. Order, Financial &amp; Transaction Data</h3>
          <div className="list">
            <span><strong>Transaction History:</strong> Itemized invoices, purchased SKUs, warranties registered, delivery timestamps, and order statuses.</span>
            <span><strong>Payment Metadata:</strong> Transaction reference IDs, selected payment channel (UPI, Net Banking, Credit/Debit card, COD), and Razorpay transaction hashes. <em>Note: We never store full credit/debit card numbers, CVVs, or net banking passwords on our servers.</em></span>
          </div>

          <h3 className="subheading">E. Technical, Device &amp; Interaction Data</h3>
          <div className="list">
            <span><strong>Device &amp; Telemetry Data:</strong> IP address, operating system, browser type and version, device brand/model, screen dimensions, and network provider.</span>
            <span><strong>Interaction Logs:</strong> Search queries entered, items added to wishlist or shopping cart, page navigation paths, and platform interaction latency.</span>
          </div>
        </section>

        {/* 3. How We Collect Your Information */}
        <section className="section" aria-label="Methods of data collection">
          <h2 className="section-title">3. How We Collect Your Information</h2>
          <div className="list">
            <span><strong>Directly from You:</strong> When you register an account, update your profile, place an order, apply for a wholesale retailer account, request customer care support, or write a product review.</span>
            <span><strong>Automated Logging:</strong> As you navigate through our marketplace, standard web server logs and frontend telemetry record technical interactions and error diagnostics.</span>
            <span><strong>Authorized Third Parties:</strong> Through integrated payment aggregators (e.g., Razorpay transaction status webhooks) and maps services (e.g., Google Maps address completion).</span>
          </div>
        </section>

        {/* 4. Purpose & Legal Basis */}
        <section className="section" aria-label="Data usage policy">
          <h2 className="section-title">4. How We Use Your Information</h2>
          <p>We process your personal data for clear, legitimate commercial and operational purposes:</p>
          <div className="list">
            <span><strong>Order Processing &amp; Fulfillment:</strong> Processing order checkouts, packaging consumer electronics, issuing GST tax invoices, and scheduling door-to-door courier dispatch.</span>
            <span><strong>Real-Time Communication:</strong> Sending order confirmations, dispatch updates, tracking links, delivery OTPs, and return status notifications via SMS, WhatsApp, and email.</span>
            <span><strong>B2B Account Validation:</strong> Verifying wholesale tier eligibility, approving business discounts, and producing compliant B2B tax invoices.</span>
            <span><strong>AI-Powered Product Recommendations:</strong> Utilizing on-platform search patterns and product interest to suggest relevant electronic accessories, compatible appliances, and seasonal offers.</span>
            <span><strong>Fraud Detection &amp; Platform Security:</strong> Preventing unauthorized logins, detecting fraudulent payment claims, mitigating bot attacks, and enforcing platform rate limits.</span>
            <span><strong>Statutory &amp; Regulatory Compliance:</strong> Fulfilling tax obligations, commercial auditing, warranty claim verifications, and law enforcement requests under valid judicial orders.</span>
          </div>
        </section>

        {/* 5. Sharing & Third-Party Disclosures */}
        <section className="section" aria-label="Third-party service providers">
          <h2 className="section-title">5. Third-Party Service Providers &amp; Disclosures</h2>
          <p>
            KripaConnect maintains a strict policy: <strong>We do not sell, rent, trade, or monetize your personal information to third-party data brokers or external advertisers.</strong> Disclosures are limited solely to trusted service providers essential to fulfilling our service:
          </p>
          <div className="list">
            <span><strong>Payment Gateway (Razorpay Software Pvt. Ltd.):</strong> Online payments are encrypted and processed by Razorpay under certified PCI-DSS Level 1 compliance. Your payment instruments are directly tokenized by the gateway.</span>
            <span><strong>Logistics &amp; Courier Networks:</strong> Contact name, delivery address, and phone number are shared with our logistics partners (e.g., Delhivery, Blue Dart, Shiprocket, or local fleet drivers) solely to effect parcel delivery.</span>
            <span><strong>Google Maps API:</strong> Address input autocompletion and reverse geocoding services to pinpoint shipping destinations accurately.</span>
            <span><strong>Cloud Infrastructure &amp; Content Delivery:</strong> Secure cloud servers, database backups, and CDN providers for fast, reliable access to product imagery and catalog data.</span>
            <span><strong>Legal &amp; Regulatory Authorities:</strong> We may disclose data if required in good faith to comply with a valid court order, government investigation, or statutory mandate under Indian law.</span>
          </div>
        </section>

        {/* 6. Cookies, Local Storage & Tracking Technologies */}
        <section className="section" aria-label="Cookies and local storage policy">
          <h2 className="section-title">6. Cookies &amp; Local Storage</h2>
          <p>
            We prioritize lightweight and privacy-respecting storage mechanisms on your device:
          </p>
          <div className="list">
            <span><strong>Essential Session Storage:</strong> JSON Web Tokens (JWT) stored securely in LocalStorage / session cookies to preserve your authenticated login state.</span>
            <span><strong>Functional Preferences:</strong> Saving your active shopping cart items, wishlist entries, and selected interface mode (Retail Consumer vs. Verified Retailer B2B).</span>
            <span><strong>Zero Invasive Third-Party Trackers:</strong> We do not embed covert advertising ad-network trackers, social media pixel sniffers, or cross-site tracking scripts.</span>
          </div>
        </section>

        {/* 7. Data Security Measures */}
        <section className="section" aria-label="Data security and protection">
          <h2 className="section-title">7. Data Security Architecture</h2>
          <p>
            We implement comprehensive technical and organizational safeguards designed to protect personal data against accidental loss, unauthorized access, alteration, or disclosure:
          </p>
          <div className="list">
            <span><strong>Transport Layer Security:</strong> All data transmitted between your browser and our servers is encrypted using modern 256-bit TLS/SSL protocols with HSTS enabled.</span>
            <span><strong>Password Hashing:</strong> Passwords are encrypted using irreversible salted bcrypt cryptographic hashing algorithms.</span>
            <span><strong>Access Control &amp; Firewalls:</strong> Administrative database access is restricted through least-privilege role-based authentication (RBAC), multi-factor safeguards, and IP whitelisting.</span>
            <span><strong>Vulnerability Management:</strong> Routine dependency scanning, API rate-limiting against brute force, and continuous server monitoring.</span>
          </div>
        </section>

        {/* 8. Data Retention Policy */}
        <section className="section" aria-label="Data retention policy">
          <h2 className="section-title">8. Data Retention Period</h2>
          <p>
            We retain personal data only for as long as necessary to fulfill the purposes for which it was collected:
          </p>
          <div className="list">
            <span><strong>Active Accounts:</strong> Account data and profile records remain stored for the lifetime of your active user account.</span>
            <span><strong>Financial &amp; Invoicing Records:</strong> Sales invoices, tax documents, and transactional ledgers are retained for a minimum statutory period of 8 years in compliance with the Indian Companies Act and GST rules.</span>
            <span><strong>Customer Support Records:</strong> Ticket logs and resolved inquiry histories are archived for up to 24 months to support warranty and post-sale service inquiries.</span>
          </div>
        </section>

        {/* 9. Your Rights & Data Subject Controls */}
        <section className="section" aria-label="User rights and controls">
          <h2 className="section-title">9. Your Rights Under DPDP Act 2023</h2>
          <p>
            In accordance with the Digital Personal Data Protection Act, 2023 and applicable privacy regulations, you possess the following rights regarding your personal information:
          </p>
          <div className="list">
            <span><strong>Right to Access &amp; Summary:</strong> You can review your profile details, order histories, and addresses by logging into your account dashboard.</span>
            <span><strong>Right to Correction &amp; Updation:</strong> You may edit inaccurate profile information or outdated delivery addresses at any time.</span>
            <span><strong>Right to Erasure / Account Deletion:</strong> You may request the deletion of your account and personal data, provided there are no active pending orders or statutory tax-record retention obligations.</span>
            <span><strong>Right to Withdraw Consent:</strong> You have the right to withdraw consent for non-essential notifications (such as marketing emails or push alerts) via account settings or email unsubscribe links.</span>
            <span><strong>Right of Grievance Redressal:</strong> You have the right to readily access grievance redressal mechanisms provided by KripaConnect.</span>
          </div>
        </section>

        {/* 10. Protection of Children's Privacy */}
        <section className="section" aria-label="Children's privacy">
          <h2 className="section-title">10. Children&apos;s Privacy</h2>
          <p>
            KripaConnect is strictly intended for use by individuals who are at least 18 years of age or competent to contract under the Indian Contract Act, 1872. We do not knowingly collect or solicit personal information from minors under the age of 18. If we discover that personal data from a minor has been collected without parental consent, we will take immediate steps to delete the record from our systems.
          </p>
        </section>

        {/* 11. Policy Updates */}
        <section className="section" aria-label="Policy updates">
          <h2 className="section-title">11. Changes &amp; Amendments to this Policy</h2>
          <p>
            We may periodically update this Privacy Policy to reflect enhancements in our platform, security practices, or changes in legal regulations. When material changes are made, we will update the &quot;Last Updated&quot; date at the top of this page and, where appropriate, notify you via banner notification or email before the changes take effect.
          </p>
        </section>

        {/* 12. Grievance Redressal Officer */}
        <section className="section" aria-label="Grievance officer details">
          <h2 className="section-title">12. Grievance Officer &amp; Regulatory Inquiries</h2>
          <p>
            Pursuant to Rule 5(9) of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 and the Consumer Protection (E-Commerce) Rules, 2020, our appointed Grievance Officer details are published below:
          </p>
          <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Officer Designation:</strong> Grievance &amp; Data Protection Officer</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Company:</strong> KripaConnect Electronics &amp; Appliances</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> <a href="mailto:grievance@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>grievance@kripaconnect.in</a> / <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>support@kripaconnect.in</a></p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Helpline:</strong> +91 98765 43210 (Mon - Sat, 10:00 AM - 6:00 PM IST)</p>
            <p style={{ margin: 0 }}><strong>Registered Address:</strong> KripaConnect Hub, Scheme No. 54, Vijay Nagar, Indore, Madhya Pradesh - 452010, India</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
