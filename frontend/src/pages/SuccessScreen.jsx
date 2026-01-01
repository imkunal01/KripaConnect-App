import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './SuccessScreen.css'

export default function SuccessScreen() {
  const { orderId } = useParams()
  const canvasRef = useRef(null)

  // --- Lightweight Confetti Engine (No libraries needed) ---
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight
    let particles = []
    
    canvas.width = width
    canvas.height = height

    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--kc-primary')
      .trim() || '#FF3D3D'
    const colors = [primary, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    function createParticle() {
      return {
        x: width / 2,
        y: height / 2, // Start from center
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 1) * 15, // Upward burst
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100,
        decay: 0.96
      }
    }

    // Burst!
    for (let i = 0; i < 100; i++) {
      particles.push(createParticle())
    }

    function animate() {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.5 // Gravity
        p.life *= p.decay
        p.size *= p.decay

        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.life < 0.1) particles.splice(index, 1)
      })
      if (particles.length > 0) requestAnimationFrame(animate)
    }
    
    animate()

    // Cleanup
    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="success-page-wrapper">
      <canvas ref={canvasRef} className="confetti-canvas" />
      <Navbar />
      
      <main className="success-container">
        <div className="receipt-card">
          {/* Animated Checkmark Icon */}
          <div className="success-icon-wrapper">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-message">
            Thank you for your purchase. We've received your order and are getting it ready.
          </p>

          {/* Ticket Style Order ID */}
          <div className="order-ticket">
            <span className="ticket-label">Order ID</span>
            <code className="ticket-code">{orderId || 'ORD-1234-5678'}</code>
            <div className="ticket-rip"></div>
          </div>

          <div className="success-actions">
            <Link to="/products" className="btn-continue">
              <span>Continue Shopping</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
            <Link to="/orders" className="btn-track">
              Track Order
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}