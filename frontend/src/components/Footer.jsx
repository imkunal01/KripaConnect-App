import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ padding: 24, background: '#f1f5f9', marginTop: 40 }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/policy">Policy</Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8, color: '#64748b' }}>© {new Date().getFullYear()} Kripa Connect</div>
    </footer>
  )
}

