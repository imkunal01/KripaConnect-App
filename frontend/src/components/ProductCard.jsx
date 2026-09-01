import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaShoppingCart } from 'react-icons/fa'
import { FiHeart } from 'react-icons/fi'
import ShopContext from '../context/ShopContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import { usePreventRageTap } from '../hooks/usePreventRageTap.js'
import './ProductCard.css'

export default function ProductCard({ product, favorite }) {
  const { addToCart, toggleFavorite } = useContext(ShopContext)
  const { role } = useAuth()
  const { mode } = usePurchaseMode()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, withPreventAdd] = usePreventRageTap({ minDelay: 200 })
  const [isTogglingFav, withPreventFav] = usePreventRageTap({ minDelay: 200 })
  const inStock = (product.stock || 0) > 0

  const isRetailer = role === 'retailer'
  const retailerBulk = isRetailer && mode === 'retailer'
  const minBulkQty = product?.min_bulk_qty > 0 ? product.min_bulk_qty : 1
  const bulkUnitPrice = product?.price_bulk || product?.retailer_price || product?.price
  const canQuickAdd = !retailerBulk || minBulkQty <= 1
  
  // Clean tags from any corrupted quotes or brackets
  const rawTag = product.tags && product.tags.length > 0 ? product.tags[0] : null
  const tag = rawTag ? String(rawTag).replace(/[\[\]"']/g, '').trim() : null
  
  return (
    <div
      className={`product-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist Button */}
      <button
        onClick={withPreventFav(async () => toggleFavorite(product._id))}
        className={`product-card-wishlist ${favorite ? 'active' : ''}`}
        disabled={isTogglingFav}
        aria-label={favorite ? 'Remove from wishlist' : 'Add to wishlist'}
        type="button"
      >
        {favorite ? (
          <FaHeart className="wishlist-icon filled" aria-hidden="true" />
        ) : (
          <FiHeart className="wishlist-icon" aria-hidden="true" />
        )}
      </button>

      {/* Image Container */}
      <Link to={`/product/${product._id}`} className="product-card-image-link" tabIndex="-1">
        <div className="product-card-image">
          {tag && <span className="product-card-badge">{tag}</span>}
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="product-card-img-placeholder" aria-hidden="true">📦</div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="product-card-body">
        <Link to={`/product/${product._id}`} className="product-card-title-link">
          <h3 className="product-card-name" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Price & Stock Row */}
        <div className="product-card-price-row">
          <div className="product-card-pricing">
            {retailerBulk ? (
              <div className="product-card-price-group">
                <span className="product-card-price-strike">
                  ₹{Number(product.price || 0).toLocaleString('en-IN')}
                </span>
                <span className="product-card-price">
                  ₹{Number(bulkUnitPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <span className="product-card-price">
                ₹{Number(product.price || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          
          <div className={`product-card-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
            <span className="stock-dot" aria-hidden="true" />
            <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
          </div>
        </div>

        {retailerBulk && minBulkQty > 1 && (
          <div className="product-card-bulk-hint">Min qty: {minBulkQty} units</div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={withPreventAdd(async () => addToCart(product, 1))}
        disabled={!inStock || !canQuickAdd || isAdding}
        className={`product-card-button ${!inStock ? 'btn-out-of-stock' : ''} ${isAdding ? 'btn-adding' : ''}`}
        type="button"
      >
        <FaShoppingCart className="btn-cart-icon" aria-hidden="true" />
        <span>
          {!inStock
            ? 'Out of Stock'
            : !canQuickAdd
            ? `Min ${minBulkQty} units`
            : isAdding
            ? 'Adding...'
            : 'Add to Cart'}
        </span>
      </button>
    </div>
  )
}
