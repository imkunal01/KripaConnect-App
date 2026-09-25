import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FiSearch,
  FiX,
  FiShoppingCart,
  FiCheck,
  FiExternalLink,
  FiInfo,
  FiCpu,
  FiArrowRight,
} from 'react-icons/fi'
import { BsStars } from 'react-icons/bs'
import ShopContext from '../context/ShopContext.jsx'
import { getSmartRecommendations } from '../services/recommendations'
import toast from 'react-hot-toast'
import './SmartSearchModal.css'

const QUICK_PROMPTS = [
  '⚡ Energy-saving BLDC fans under ₹3500',
  '💡 Waterproof LED street & flood lights',
  '🛠️ Heavy-duty cordless drill & impact driver',
  '🔌 Modular switch plates & spike guards',
  '📱 Quick charge power bank & Type-C cable',
]

export default function SmartSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { addToCart } = useContext(ShopContext)
  const inputRef = useRef(null)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [addedIds, setAddedIds] = useState({})

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSearch(searchQuery) {
    const q = (searchQuery || query).trim()
    if (!q) return

    setLoading(true)
    setResult(null)

    try {
      const data = await getSmartRecommendations(q, 8)
      setResult(data)
    } catch (err) {
      toast.error('Failed to get smart recommendations.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSearch()
  }

  function handlePromptClick(prompt) {
    setQuery(prompt)
    handleSearch(prompt)
  }

  async function handleAddToCart(product) {
    const prodId = product.id || product._id
    try {
      await addToCart(
        {
          _id: prodId,
          name: product.name,
          price: product.price,
          images: product.images || [],
          stock: product.stock,
        },
        1
      )
      setAddedIds((prev) => ({ ...prev, [prodId]: true }))
      toast.success(`${product.name} added to cart!`)
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [prodId]: false }))
      }, 2000)
    } catch {
      toast.error('Could not add to cart.')
    }
  }

  function handleViewInCatalog() {
    onClose()
    navigate(`/products?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="smart-search-overlay" onClick={onClose}>
      <div
        className="smart-search-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="smart-search-header">
          <div className="smart-search-title-wrap">
            <div className="smart-search-badge">
              <BsStars className="smart-search-sparkle-icon" />
              <span>AI Assistant</span>
            </div>
            <h2>Smart Product Search</h2>
          </div>
          <button
            type="button"
            className="smart-search-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSubmit} className="smart-search-form">
          <div className="smart-search-input-box">
            <FiSearch className="smart-search-input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="smart-search-input"
              placeholder="Ask anything (e.g., 'Silent fans under ₹3000' or 'Waterproof lights')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="smart-search-input-clear"
                onClick={() => setQuery('')}
              >
                <FiX />
              </button>
            )}
            <button
              type="submit"
              className="smart-search-submit-btn"
              disabled={loading || !query.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick Prompts */}
        {!result && !loading && (
          <div className="smart-search-prompts">
            <p className="smart-search-prompts-label">Try asking:</p>
            <div className="smart-search-prompts-list">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="smart-search-prompt-pill"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="smart-search-loading">
            <div className="smart-search-spinner" />
            <div className="smart-search-loading-text">
              <BsStars className="smart-search-spinner-icon" />
              <span>Finding the best matches with AI...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="smart-search-results">
            {/* AI Reasoning / Answer */}
            {result.answer && (
              <div className="smart-search-answer-card">
                <div className="smart-search-answer-header">
                  <BsStars className="smart-search-ai-icon" />
                  <h4>AI Recommendation</h4>
                  {result.source === 'rag_microservice' && (
                    <span className="smart-search-source-tag">
                      <FiCpu /> RAG Powered
                    </span>
                  )}
                </div>
                <p className="smart-search-answer-text">{result.answer}</p>

                {/* Parsed Filters Tags */}
                {result.parsed_filters && (
                  <div className="smart-search-tags-row">
                    {result.parsed_filters.category && (
                      <span className="smart-search-filter-tag">
                        Category: <strong>{result.parsed_filters.category}</strong>
                      </span>
                    )}
                    {result.parsed_filters.min_price && (
                      <span className="smart-search-filter-tag">
                        Min: ₹{result.parsed_filters.min_price.toLocaleString('en-IN')}
                      </span>
                    )}
                    {result.parsed_filters.max_price && (
                      <span className="smart-search-filter-tag">
                        Max: ₹{result.parsed_filters.max_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Why Recommended bullet insights */}
            {result.why_recommended?.length > 0 && (
              <div className="smart-search-insights">
                <h5>
                  <FiInfo /> Why These Products?
                </h5>
                <ul>
                  {result.why_recommended.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Products Grid */}
            <div className="smart-search-products-header">
              <h3>Recommended Products ({result.products?.length || 0})</h3>
              <button
                type="button"
                className="smart-search-catalog-link"
                onClick={handleViewInCatalog}
              >
                View all in Catalog <FiArrowRight />
              </button>
            </div>

            {(!result.products || result.products.length === 0) ? (
              <div className="smart-search-empty">
                <p>No direct recommendations found. Try a different query or browse the catalogue.</p>
                <button
                  type="button"
                  className="smart-search-browse-btn"
                  onClick={handleViewInCatalog}
                >
                  Browse Full Catalogue
                </button>
              </div>
            ) : (
              <div className="smart-search-grid">
                {result.products.map((item) => {
                  const itemId = item.id || item._id
                  const isAdded = !!addedIds[itemId]
                  const imageUrl =
                    item.images?.[0]?.url ||
                    (typeof item.image === 'string' ? item.image : '') ||
                    '/placeholder.png'

                  return (
                    <div key={itemId} className="smart-product-card">
                      <Link
                        to={`/product/${itemId}`}
                        onClick={onClose}
                        className="smart-product-img-wrap"
                      >
                        <img
                          src={imageUrl}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src =
                              'https://placehold.co/200x200?text=KripaConnect'
                          }}
                        />
                      </Link>

                      <div className="smart-product-info">
                        <span className="smart-product-category">
                          {item.category || 'Product'}
                        </span>
                        <Link
                          to={`/product/${itemId}`}
                          onClick={onClose}
                          className="smart-product-name"
                          title={item.name}
                        >
                          {item.name}
                        </Link>

                        <div className="smart-product-price-row">
                          <span className="smart-product-price">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`smart-product-stock ${
                              item.stock > 0 ? 'in' : 'out'
                            }`}
                          >
                            {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        <div className="smart-product-actions">
                          <button
                            type="button"
                            className={`smart-product-cart-btn ${
                              isAdded ? 'added' : ''
                            }`}
                            disabled={item.stock <= 0}
                            onClick={() => handleAddToCart(item)}
                          >
                            {isAdded ? (
                              <>
                                <FiCheck /> Added
                              </>
                            ) : (
                              <>
                                <FiShoppingCart /> Add
                              </>
                            )}
                          </button>
                          <Link
                            to={`/product/${itemId}`}
                            onClick={onClose}
                            className="smart-product-view-link"
                          >
                            View <FiExternalLink />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
