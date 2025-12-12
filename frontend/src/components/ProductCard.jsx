import { useContext } from 'react'
import { Link } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'

export default function ProductCard({ product, favorite }) {
  const { addToCart, toggleFavorite } = useContext(ShopContext)
  const inStock = (product.stock || 0) > 0
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
          <img src={product.images?.[0]?.url} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      </Link>
      <div style={{ marginTop: 8, fontWeight: 600 }}>{product.name}</div>
      <div style={{ color: '#333' }}>₹{product.price}</div>
      {product.tags && product.tags.length > 0 && <div style={{ color: '#64748b', fontSize: 12 }}>{product.tags[0]}</div>}
      <div style={{ marginTop: 8, fontSize: 12, color: inStock ? '#16a34a' : '#ef4444' }}>{inStock ? 'In Stock' : 'Out of Stock'}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="nav-btn signup-btn" disabled={!inStock} onClick={() => addToCart(product, 1)}>Add to Cart</button>
        <button className="nav-btn" onClick={() => toggleFavorite(product._id)}>{favorite ? '★' : '☆'} Favorite</button>
      </div>
    </div>
  )
}
