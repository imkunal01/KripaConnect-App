import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './StaticPages.css'

export default function About() {
  return (
    <div className="static-page">
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">About KripaConnect</h1>
          <p className="hero-lead">Connecting quality products with seamless modern commerce.</p>
        </section>
        <section className="section grid-two">
          <div className="card">
            <h3 className="section-title">Our Mission</h3>
            <p className="muted">Deliver a smooth shopping experience with reliable logistics, secure payments, and curated selections.</p>
          </div>
          <div className="card">
            <h3 className="section-title">What We Value</h3>
            <div className="list">
              <span>Customer trust</span>
              <span>Transparent pricing</span>
              <span>Responsive support</span>
              <span>Continuous improvement</span>
            </div>
          </div>
        </section>
        <section className="section">
          <h3 className="section-title">Highlights</h3>
          <div className="grid-two">
            <div className="card">
              <strong>Secure Checkout</strong>
              <p className="muted">Best-in-class security across the full payment flow.</p>
            </div>
            <div className="card">
              <strong>Fast Fulfillment</strong>
              <p className="muted">Real-time order tracking and dependable delivery partners.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

