import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './StaticPages.css'

export default function Contact() {
  return (
    <div className="static-page">
      <Navbar />
      <main className="page-main">
        <section className="hero">
          <h1 className="hero-title">Contact Us</h1>
          <p className="hero-lead">We are here to help with orders, products, and partnerships.</p>
        </section>
        <section className="section grid-two">
          <div className="card">
            <h3 className="section-title">Support</h3>
            <div className="list">
              <span>Email: support@BizLink.example</span>
              <span>Hours: Mon–Sat, 9am–6pm IST</span>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">Partnerships</h3>
            <div className="list">
              <span>Email: partners@BizLink.example</span>
              <span>For retailers and B2B collaboration</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

