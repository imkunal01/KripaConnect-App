import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import './ProductCard.css'

export default function ProductCard({ product, favorite }) {
  const { addToCart, toggleFavorite } = useContext(ShopContext)
  const [isHovered, setIsHovered] = useState(false)
  const inStock = (product.stock || 0) > 0
  
  return (
    <div
      className={`product-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist Icon - Top Right */}
      <button
        onClick={() => toggleFavorite(product._id)}
        className={`product-card-wishlist ${favorite ? 'active' : ''}`}
      >
        {favorite ? '❤️' : '🤍'}
      </button>

      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-card-image">
          {product.images?.[0]?.url ? (
            <img src={product.images[0].url} alt={product.name} />
          ) : (
            <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
          )}
        </div>
      </Link>

      <div style={{ marginBottom: '0.5rem' }}>
        <Link to={`/product/${product._id}`} className="product-card-link">
          <div className="product-card-name">{product.name}</div>
        </Link>
        
        {product.tags && product.tags.length > 0 && (
          <div className="product-card-tag">{product.tags[0]}</div>
        )}

        <div className="product-card-price-row">
          <div className="product-card-price">₹{product.price?.toLocaleString('en-IN')}</div>
          <div className={`product-card-stock ${inStock ? '' : 'out-of-stock'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      </div>

      <button
        onClick={() => addToCart(product, 1)}
        disabled={!inStock}
        className="product-card-button"
      >
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  )
}
