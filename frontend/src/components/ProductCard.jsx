import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import './ProductCard.css'

export default function ProductCard({ product, favorite }) {
  const { addToCart, toggleFavorite } = useContext(ShopContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  const [isHovered, setIsHovered] = useState(false)
  const inStock = (product.stock || 0) > 0

  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'
  const minBulkQty = product?.min_bulk_qty > 0 ? product.min_bulk_qty : 1
  const bulkUnitPrice = product?.price_bulk || product?.retailer_price || product?.price
  const canQuickAdd = !retailerBulk || minBulkQty <= 1
  
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

      <div className="product-card-body">
        <Link to={`/product/${product._id}`} className="product-card-link">
          <div className="product-card-name">{product.name}</div>
        </Link>
        
        {product.tags && product.tags.length > 0 && (
          <div className="product-card-tag">{product.tags[0]}</div>
        )}

        <div className="product-card-price-row">
          {retailerBulk ? (
            <div className="product-card-price">
              <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 8 }}>
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              <span>
                ₹{bulkUnitPrice?.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <div className="product-card-price">₹{product.price?.toLocaleString('en-IN')}</div>
          )}
          <div className={`product-card-stock ${inStock ? '' : 'out-of-stock'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        {retailerBulk && minBulkQty > 1 && (
          <div className="product-card-tag">Min bulk qty: {minBulkQty}</div>
        )}
      </div>

      <button
        onClick={() => addToCart(product, 1)}
        disabled={!inStock || !canQuickAdd}
        className="product-card-button"
      >
        {!inStock ? 'Out of Stock' : !canQuickAdd ? `Min ${minBulkQty} units` : 'Add to Cart'}
      </button>
    </div>
  )
}
