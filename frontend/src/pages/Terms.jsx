import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './StaticPages.css'

export default function Terms() {
  return (
    <div className="static-page">
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Terms & Conditions</h1>
          <p className="hero-lead">Please review the terms governing use of KripaConnect.</p>
        </section>
        <section className="section">
          <h3 className="section-title">Use of Service</h3>
          <div className="list">
            <span>Maintain accurate account information</span>
            <span>Comply with applicable laws and policies</span>
            <span>Respect intellectual property rights</span>
          </div>
        </section>
        <section className="section">
          <h3 className="section-title">Orders</h3>
          <div className="list">
            <span>Orders are subject to availability and confirmation</span>
            <span>Pricing may update based on promotions or stock</span>
            <span>We reserve the right to cancel due to errors or risk</span>
          </div>
        </section>
        <section className="section">
          <h3 className="section-title">Liability</h3>
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

