import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import './StaticPages.css'

export default function Terms() {
  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms and Conditions of Service',
    description: 'Comprehensive terms of service, purchasing rules, commercial retailer obligations, warranty guidelines, and legal provisions on KripaConnect.',
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
        description="Review the Terms and Conditions governing your use of KripaConnect retail and B2B wholesale services, ordering rules, accounts, warranties, and dispute policies."
        canonical="/terms"
        schema={termsSchema}
      />
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Terms &amp; Conditions</h1>
          <p className="hero-lead">
            Last Updated: November 2026. Please review these legally binding Terms of Service carefully before browsing, registering, or transacting on KripaConnect Electronics &amp; Appliances.
          </p>
        </section>

        {/* 1. Agreement & Acceptance */}
        <section className="section" aria-label="Agreement and acceptance">
          <h2 className="section-title">1. Acceptance of Terms &amp; Scope of Service</h2>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) constitute a legally enforceable electronic contract between you (&quot;User&quot;, &quot;Buyer&quot;, &quot;Retailer&quot;, or &quot;Customer&quot;) and <strong>KripaConnect Electronics &amp; Appliances</strong> (&quot;KripaConnect&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), governing your access to and use of our web application (<strong>kripaconnect.in</strong>), mobile apps, and associated digital services.
          </p>
          <p>
            By accessing, browsing, registering an account, or placing an order on our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms, together with our <a href="/privacy" style={{ color: '#FF3D3D', fontWeight: 600 }}>Privacy Policy</a> and <a href="/returns" style={{ color: '#FF3D3D', fontWeight: 600 }}>Refund &amp; Cancellation Policy</a>. If you do not agree to these terms, you must immediately refrain from accessing or purchasing on KripaConnect.
          </p>
        </section>

        {/* 2. Eligibility & Capacity to Contract */}
        <section className="section" aria-label="User eligibility">
          <h2 className="section-title">2. User Eligibility &amp; Contractual Capacity</h2>
          <p>
            Use of the platform is available only to persons who can form legally binding contracts under the Indian Contract Act, 1872. Persons who are &quot;incompetent to contract&quot; within the meaning of the Indian Contract Act, including minors (under 18 years of age) and un-discharged insolvents, are not eligible to register or transact on this platform.
          </p>
          <p>
            If you are registering on behalf of a registered proprietorship, partnership firm, company, or commercial establishment, you warrant that you possess full corporate and legal authority to bind that entity to these Terms.
          </p>
        </section>

        {/* 3. Account Registration & Security */}
        <section className="section" aria-label="Account security and verification">
          <h2 className="section-title">3. Account Registration &amp; Security Responsibilities</h2>
          <div className="list">
            <span><strong>Accurate Registration:</strong> You agree to provide true, accurate, complete, and current information regarding your identity, contact phone number, email address, and physical shipping address during registration.</span>
            <span><strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your account credentials, password, and OTP verification codes. You agree to notify us immediately of any unauthorized access or breach of security.</span>
            <span><strong>Account Ownership:</strong> You may not transfer, assign, or sell your KripaConnect account or credentials to any third party without our prior written consent.</span>
            <span><strong>Suspension &amp; Revocation:</strong> KripaConnect reserves the right to suspend or terminate accounts that provide false contact information, engage in abusive practices, make fraudulent chargebacks, or violate these Terms.</span>
          </div>
        </section>

        {/* 4. Products, Pricing & Accuracy */}
        <section className="section" aria-label="Catalog, pricing and stock">
          <h2 className="section-title">4. Products, Specifications &amp; Pricing Policies</h2>
          <p>
            We strive to display product specifications, dimensions, features, and photographic representations as accurately as provided by authorized OEM manufacturers and brand partners.
          </p>
          <div className="list">
            <span><strong>Currency &amp; GST:</strong> All prices quoted across the platform are in Indian Rupees (INR - ₹). Retail prices include applicable Goods and Services Tax (GST) unless otherwise explicitly itemized on B2B invoices.</span>
            <span><strong>Real-Time Inventory:</strong> Order acceptance is subject to real-time warehouse inventory availability. Items in your cart are not reserved until checkout payment is completed.</span>
            <span><strong>Typographical &amp; Clerical Errors:</strong> In the rare event a product is listed at an incorrect price or with incorrect specifications due to a typographical error or technical glitch, KripaConnect reserves the right to decline or cancel orders placed for that product, issuing a full 100% refund promptly.</span>
            <span><strong>Packaging &amp; Minor Aesthetic Variations:</strong> Product packaging, outer boxes, and minor aesthetic trims may vary slightly from displayed visuals due to OEM manufacturer revisions without prior notice.</span>
          </div>
        </section>

        {/* 5. Retailer B2B Wholesale Portal Provisions */}
        <section className="section" aria-label="B2B Wholesale terms">
          <h2 className="section-title">5. Commercial Retailer &amp; B2B Wholesale Portal</h2>
          <p>
            KripaConnect provides a specialized B2B wholesale platform for verified commercial trade partners and retail shop owners. Users accessing wholesale rates agree to the following mandatory stipulations:
          </p>
          <div className="list">
            <span><strong>Minimum Order Quantities (MOQ):</strong> Tiered wholesale volume pricing is strictly contingent upon meeting or exceeding the minimum carton/case quantity specified per SKU.</span>
            <span><strong>GSTIN &amp; Tax Compliance:</strong> Retailers must supply a valid Goods and Services Tax Identification Number (GSTIN) matching their commercial entity to claim Input Tax Credit (ITC). Commercial invoices will be generated in accordance with GST statutory guidelines.</span>
            <span><strong>Retail Resale &amp; MRP Adherence:</strong> B2B buyers purchase items for commercial resale or business consumption and agree to respect Maximum Retail Price (MRP) guidelines and regional trade statutes.</span>
            <span><strong>Wholesale Returns &amp; Inspections:</strong> Commercial bulk shipments must be inspected upon delivery. Damaged or short-shipped cartons must be marked on the Proof of Delivery (POD) slip and reported within 48 hours of receipt.</span>
          </div>
        </section>

        {/* 6. Payment, Invoicing & Digital Transactions */}
        <section className="section" aria-label="Payments and transactions">
          <h2 className="section-title">6. Payment Terms &amp; Invoicing</h2>
          <p>
            KripaConnect supports secure digital payment options as well as Cash on Delivery (COD) for eligible pin codes:
          </p>
          <div className="list">
            <span><strong>Digital Payment Processing:</strong> Online transactions are handled through our certified gateway partner Razorpay, supporting Unified Payments Interface (UPI), Debit Cards, Credit Cards, Net Banking, and verified digital wallets.</span>
            <span><strong>Cash on Delivery (COD) Guidelines:</strong> COD orders require exact currency payment upon package handover. Delivery agents are instructed not to open sealed brand packaging before receiving full cash settlement.</span>
            <span><strong>Failed Transactions:</strong> In instances where funds are debited from your bank account but the order is not confirmed on the platform due to gateway timeout, the transaction amount will typically be reversed automatically by the issuing bank within 3 to 5 banking days.</span>
            <span><strong>Digital Invoices:</strong> Official tax invoices are automatically generated and made available for download within your My Orders dashboard immediately after purchase.</span>
          </div>
        </section>

        {/* 7. Shipping, Delivery & Inspection */}
        <section className="section" aria-label="Shipping and delivery">
          <h2 className="section-title">7. Shipping, Doorstep Delivery &amp; Transit Risk</h2>
          <div className="list">
            <span><strong>Delivery Timelines:</strong> Estimated shipping windows displayed at checkout are indicative and subject to operational logistics, road conditions, and force majeure events. Standard regional deliveries typically arrive within 2 to 5 business days.</span>
            <span><strong>Recipient Availability:</strong> The buyer is responsible for ensuring an authorized recipient is present at the designated shipping address. If delivery fails after three documented attempts, the package may be returned to our warehouse, and reshipment fees may apply.</span>
            <span><strong>Outer Box Inspection:</strong> Customers are urged to examine the outer tamper-evident packaging before accepting delivery. If a parcel arrives visibly crushed, water-damaged, or tampered with, refuse delivery and immediately notify KripaConnect support.</span>
          </div>
        </section>

        {/* 8. Brand Warranties & OEM Guarantees */}
        <section className="section" aria-label="Warranties and OEM guarantees">
          <h2 className="section-title">8. Brand Warranties &amp; Manufacturer Guarantees</h2>
          <p>
            All electronic items, smart televisions, large home appliances, audio equipment, and kitchen electronics sold on KripaConnect are 100% genuine, brand-new, and sourced through authorized national distributors:
          </p>
          <div className="list">
            <span><strong>OEM Manufacturer Warranty:</strong> Every branded product is covered under the respective manufacturer’s standard warranty terms as detailed in the user manual and warranty card enclosed within the package.</span>
            <span><strong>Initial 7-Day Replacement:</strong> In case of an out-of-the-box manufacturing defect or damage in transit reported within 7 days of delivery, KripaConnect facilitates direct pickup and replacement pursuant to our <a href="/returns" style={{ color: '#FF3D3D', fontWeight: 600 }}>Refund &amp; Cancellation Policy</a>.</span>
            <span><strong>Authorized Service Centers:</strong> Beyond the 7-day replacement window, warranty repairs, inspections, and component replacements must be carried out directly through the brand&apos;s authorized service centers across India.</span>
            <span><strong>Warranty Exclusions:</strong> Warranties do not cover damage resulting from improper installation, external electrical power surges, lightning strikes, physical abuse, liquid spillage, or unauthorized repair attempts.</span>
          </div>
        </section>

        {/* 9. User Conduct & Prohibited Activities */}
        <section className="section" aria-label="User conduct and prohibited use">
          <h2 className="section-title">9. User Conduct &amp; Prohibited Activities</h2>
          <p>When accessing or using KripaConnect, you agree that you shall NOT:</p>
          <div className="list">
            <span>Post, upload, or transmit any content that is unlawful, defamatory, obscene, harassing, racially offensive, or infringes any third-party intellectual property.</span>
            <span>Deploy automated scrapers, web spiders, crawlers, or harvesting tools to extract catalog data, product images, or pricing lists without express written authorization.</span>
            <span>Attempt to bypass, disable, or compromise platform authentication, rate-limiting, firewall rules, or server integrity.</span>
            <span>Place fictitious, speculative, or fraudulent orders with intentional payment repudiation or chargeback misuse.</span>
            <span>Submit fake or malicious customer reviews intending to unfairly harm brand reputation or manipulate marketplace ratings.</span>
          </div>
        </section>

        {/* 10. Intellectual Property Rights */}
        <section className="section" aria-label="Intellectual property">
          <h2 className="section-title">10. Intellectual Property Rights</h2>
          <p>
            All content hosted on KripaConnect, including logos, graphical banners, software code, UI designs, icons, typography, and database compilations, is the exclusive property of KripaConnect or licensed from respective manufacturer brand partners.
          </p>
          <p>
            No portion of the platform or its materials may be reproduced, mirrored, modified, republished, or commercially distributed without prior written consent from KripaConnect management.
          </p>
        </section>

        {/* 11. Disclaimer of Warranties & Limitation of Liability */}
        <section className="section" aria-label="Limitation of liability">
          <h2 className="section-title">11. Limitation of Liability &amp; Disclaimers</h2>
          <p>
            The platform and all contents, products, and services are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranty of any kind, either express or implied, except as otherwise stated in writing.
          </p>
          <p>
            To the maximum extent permitted under applicable law, KripaConnect, its directors, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, punitive, or consequential damages resulting from platform downtime, loss of business revenue, delivery delays caused by logistics carriers, or electrical fluctuations at consumer premises.
          </p>
          <p>
            In all events, the total aggregate liability of KripaConnect for any claim arising out of or related to an order placed on the platform shall not exceed the actual amount received by KripaConnect for the specific product giving rise to the dispute.
          </p>
        </section>

        {/* 12. Indemnification */}
        <section className="section" aria-label="Indemnification">
          <h2 className="section-title">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless KripaConnect, its officers, directors, agents, and employees from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from your breach of these Terms, violation of any law, or infringement of any third-party rights.
          </p>
        </section>

        {/* 13. Termination */}
        <section className="section" aria-label="Termination">
          <h2 className="section-title">13. Termination &amp; Severability</h2>
          <p>
            These Terms remain effective unless terminated by either you or KripaConnect. You may terminate your agreement by closing your account and discontinuing further use of the platform. We reserve the right to immediately suspend or terminate your access without prior notice if we believe you have breached these Terms.
          </p>
          <p>
            If any provision of these Terms is deemed unlawful, void, or unenforceable by an arbitrator or court of competent jurisdiction, that provision shall be severable and shall not affect the validity and enforceability of any remaining provisions.
          </p>
        </section>

        {/* 14. Governing Law & Dispute Resolution */}
        <section className="section" aria-label="Governing law and jurisdiction">
          <h2 className="section-title">14. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms shall be interpreted and governed in all respects by the laws of the Republic of India, without regard to principles of conflicts of law.
          </p>
          <p>
            Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall first be attempted to be resolved amicably through mutual discussions. If unresolved within 30 days, the courts located in <strong>Indore, Madhya Pradesh, India</strong> shall have exclusive jurisdiction over all legal proceedings.
          </p>
        </section>

        {/* 15. Customer Care & Contact Information */}
        <section className="section" aria-label="Contact and grievance details">
          <h2 className="section-title">15. Contact Us &amp; Grievances</h2>
          <p>
            For questions, clarifications, order assistance, or formal grievances concerning these Terms and Conditions, please contact us:
          </p>
          <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>Legal &amp; Compliance Team:</strong> KripaConnect Legal Cell</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> <a href="mailto:support@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>support@kripaconnect.in</a> / <a href="mailto:legal@kripaconnect.in" style={{ color: '#FF3D3D', fontWeight: 600 }}>legal@kripaconnect.in</a></p>
            <p style={{ margin: '0 0 8px 0' }}><strong>Phone Helpline:</strong> +91 98765 43210 (Mon - Sat, 10:00 AM - 6:00 PM IST)</p>
            <p style={{ margin: 0 }}><strong>Registered Address:</strong> KripaConnect Hub, Scheme No. 54, Vijay Nagar, Indore, Madhya Pradesh - 452010, India</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
