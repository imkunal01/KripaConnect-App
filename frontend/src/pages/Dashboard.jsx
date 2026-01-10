import { Link, useNavigate } from 'react-router-dom'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import './Dashboard.css'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { listCategories } from '../services/categories'
import { listProducts } from '../services/products'
import ShopContext from '../context/ShopContext.jsx'
import heroimg from '../assets/auntyvibing.png'
import heroimg2 from '../assets/heroimg.png'

export default function Dashboard() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const { addToCart } = useContext(ShopContext)
  
  useEffect(() => {
    if (user && role === 'admin') navigate('/admin', { replace: true })
  }, [user, role, navigate])

  const [products, setProducts] = useState([])
  const [discountProducts, setDiscountProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [saleProduct, setSaleProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, newest, discount, best, top] = await Promise.all([
          listCategories().catch(() => []),
          listProducts({ sort: '-createdAt', limit: 9 }).catch(() => ({ items: [] })),
          listProducts({ sort: 'price', limit: 3 }).catch(() => ({ items: [] })),
          listProducts({ sort: '-sold', limit: 10 }).catch(() => ({ items: [] })),
          listProducts({ sort: '-sold', limit: 1 }).catch(() => ({ items: [] }))
        ])

        const newestItems = newest.items || []
        const discountItems = discount.items || []
        const bestItems = best.items || []
        const topItem = (top.items || [])[0]

        setProducts(newestItems)
        setDiscountProducts(discountItems)
        setBestSellers(bestItems)
        setCategories(Array.isArray(cats) ? cats : [])
        setSaleProduct(topItem || newestItems[0] || null)
      } catch (err) {
        console.error("Dashboard load failed", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const heroProduct = useMemo(() => {
    return saleProduct || products[0] || null
  }, [saleProduct, products])

  function getImageUrl(p) {
    return p?.images?.[0]?.url || ''
  }

  function formatPrice(p) {
    return (p?.price ?? 0).toLocaleString('en-IN')
  }

  async function handleAddToCart(product) {
    const inStock = (product?.stock || 0) > 0
    if (!inStock) return
    try {
      await addToCart(product, 1)
    } catch {
      // toast handled in context
    }
  }

  return (
    <div className="dash-page">
      <Navbar />

      <main className="dash-container">
        {/* Minimal Hero */}
        <section className="dash-hero">
          <div className="dash-hero-left">
            <h1>Apni Shop,Online</h1>
            <p>
              Shop for electronic products with us, guaranteed quality, fast delivery and arrived safely to the destination.
            </p>
            <Link to="/products" className="dash-btn-primary">Shop Now</Link>

            <div className="dash-hero-metrics" aria-label="Store highlights">
              <div className="dash-metric">
                <div className="dash-metric-title">4k+ products</div>
              </div>
              <div className="dash-metric">
                <div className="dash-metric-title">7d guarantee</div>
              </div>
              <div className="dash-metric">
                <div className="dash-metric-title">100% original</div>
              </div>
            </div>
          </div>

          <div className="dash-hero-right">
            {heroProduct && getImageUrl(heroProduct) ? (
              // <img src={getImageUrl(heroProduct)} alt={heroProduct.name} />
              <img src={heroimg} alt={heroProduct.name} />
            ) : (
              <div className="dash-hero-img-placeholder" aria-hidden="true" />
            )}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="dash-section dash-surface dash-categories">
            <div className="dash-section-header">
              <div>
                <h2>
                  CATEGORY <span className="dash-arrow" aria-hidden="true">→</span>
                </h2>
                <p>Shop by category.</p>
              </div>
              <Link to="/products" className="dash-link">Browse</Link>
            </div>

            <div className="dash-category-row" role="list">
              {categories.slice(0, 10).map((c) => (
                <Link
                  key={c._id}
                  to={`/products?category=${c._id}`}
                  className="dash-category-card"
                  role="listitem"
                >
                  <div className="dash-category-initial" aria-hidden="true">
                    {String(c.name || '').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="dash-category-name">{c.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Product Section */}
        <section className="dash-section dash-surface">
          <div className="dash-section-header">
            <div>
              <h2>
                PRODUCT <span className="dash-arrow" aria-hidden="true">→</span>
              </h2>
              <p>Browse our latest picks.</p>
            </div>
            <Link to="/products" className="dash-link">View all</Link>
          </div>

          <div className="dash-products-grid" aria-busy={loading ? 'true' : 'false'}>
            {loading ? (
              <div className="dash-loading">Loading products…</div>
            ) : (
              products.map((p) => {
                const inStock = (p.stock || 0) > 0
                return (
                  <div key={p._id} className="dash-card">
                    <div className="dash-card-rating" aria-label="Rating">
                      <span className="dash-star" aria-hidden="true">★</span>
                      <span>5.0</span>
                    </div>

                    <Link to={`/product/${p._id}`} className="dash-card-imageLink" aria-label={p.name}>
                      <div className="dash-card-imageBox">
                        {getImageUrl(p) ? (
                          <img src={getImageUrl(p)} alt={p.name} loading="lazy" />
                        ) : (
                          <div className="dash-img-fallback" aria-hidden="true" />
                        )}
                      </div>
                    </Link>

                    <div className="dash-card-body">
                      <Link to={`/product/${p._id}`} className="dash-card-title">
                        {p.name}
                      </Link>
                      <div className="dash-card-price">₹{formatPrice(p)}</div>
                      <div className="dash-card-actions">
                        <button
                          type="button"
                          className="dash-btn-add"
                          onClick={() => handleAddToCart(p)}
                          disabled={!inStock}
                        >
                          {inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <section className="dash-section dash-surface">
            <div className="dash-section-header">
              <div>
                <h2>
                  BEST SELLERS <span className="dash-arrow" aria-hidden="true">→</span>
                </h2>
                <p>Popular picks right now.</p>
              </div>
              <Link to="/products?sort=-sold" className="dash-link">See all</Link>
            </div>

            <div className="dash-scroll-row" aria-label="Best sellers">
              {bestSellers.map((p, idx) => (
                <Link
                  key={p._id}
                  to={`/product/${p._id}`}
                  className="dash-mini-card"
                  aria-label={`Best seller #${idx + 1}: ${p.name}`}
                >
                  <div className="dash-mini-media">
                    <div className="dash-mini-badge" aria-hidden="true">#{idx + 1}</div>
                    {getImageUrl(p) ? (
                      <img src={getImageUrl(p)} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="dash-mini-img-fallback" aria-hidden="true" />
                    )}
                  </div>
                  <div className="dash-mini-body">
                    <div className="dash-mini-title">{p.name}</div>
                    <div className="dash-mini-meta">
                      <div className="dash-mini-price">₹{formatPrice(p)}</div>
                      <div className="dash-mini-cta" aria-hidden="true">View →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Discount Section (below Product) */}
        <section className="dash-discount">
          <div className="dash-discount-inner">
            <div className="dash-discount-left">
              <h2>DISCOUNT</h2>
              <p>Best value deals, updated daily.</p>
              <Link to="/products?sort=price" className="dash-btn-secondary">Explore</Link>
            </div>

            <div className="dash-discount-right">
              {(discountProducts || []).map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="dash-discount-card">
                  <div className="dash-discount-card-img">
                    {getImageUrl(p) ? <img src={getImageUrl(p)} alt={p.name} loading="lazy" /> : null}
                  </div>
                  <div className="dash-discount-card-text">
                    <div className="dash-discount-card-name">{p.name}</div>
                    <div className="dash-discount-card-price">₹{formatPrice(p)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Sale Section */}
        <section className="dash-sale" aria-label="Sale banner">
          <div className="dash-sale-inner">
            <div className="dash-sale-left">
              <div className="dash-sale-kicker">Mega sale</div>
              <div className="dash-sale-title">PRODUCT</div>
              <div className="dash-sale-sub">For a limited time offer</div>

              <Link to="/products" className="dash-sale-cta">Order Now</Link>
              <div className="dash-sale-foot">Call for more info • 123 0000 0000</div>
            </div>

            <div className="dash-sale-badge" aria-hidden="true">
              <div className="dash-sale-percent">50</div>
              <div className="dash-sale-off">% OFF</div>
            </div>

            <div className="dash-sale-right">
              {saleProduct && getImageUrl(saleProduct) ? (
                <img src={heroimg2} alt={saleProduct.name} loading="lazy" />
              ) : (
                <div className="dash-sale-img-placeholder" aria-hidden="true" />
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="dash-benefits dash-surface" aria-label="Store benefits">
          <div className="dash-benefits-grid">
            <div className="dash-benefit">
              <div className="dash-benefit-title">Fast delivery</div>
              <div className="dash-benefit-sub">Quick dispatch & tracked shipping.</div>
            </div>
            <div className="dash-benefit">
              <div className="dash-benefit-title">Secure payments</div>
              <div className="dash-benefit-sub">Trusted checkout experience.</div>
            </div>
            <div className="dash-benefit">
              <div className="dash-benefit-title">Quality checked</div>
              <div className="dash-benefit-sub">Verified products and sellers.</div>
            </div>
            <div className="dash-benefit">
              <div className="dash-benefit-title">Support</div>
              <div className="dash-benefit-sub">Help when you need it.</div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
