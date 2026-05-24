import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import './ProductHeroCarousel.css'

function getSlideImage(slide) {
  return slide.image?.url || slide.product?.images?.[0]?.url || ''
}

function getProductPrice(product) {
  if (!product?.price) return ''
  return `Rs ${Number(product.price).toLocaleString('en-IN')}`
}

export default function ProductHeroCarousel({ banners = [], fallbackProducts = [] }) {
  const slides = useMemo(() => {
    if (banners.length > 0) return banners
    return fallbackProducts.slice(0, 5).map(product => ({
      _id: product._id,
      title: product.name,
      subtitle: product.description || 'Featured deal selected for this collection.',
      badge: Array.isArray(product.tags) && product.tags.length ? product.tags[0] : 'Featured offer',
      ctaLabel: 'View deal',
      product,
      image: product.images?.[0] || {},
    }))
  }, [banners, fallbackProducts])

  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const id = setInterval(() => {
      setActive(current => (current + 1) % slides.length)
    }, 5200)
    return () => clearInterval(id)
  }, [slides.length])

  if (slides.length === 0) return null

  const slide = slides[active]
  const image = getSlideImage(slide)
  const productHref = slide.product?._id ? `/product/${slide.product._id}` : '/products'

  function move(delta) {
    setActive(current => (current + delta + slides.length) % slides.length)
  }

  return (
    <section className="product-hero" aria-label="Featured product offers">
      <div className="product-hero__copy">
        {slide.badge && <div className="product-hero__badge">{slide.badge}</div>}
        <h1 className="product-hero__title">{slide.title}</h1>
        {slide.subtitle && <p className="product-hero__subtitle">{slide.subtitle}</p>}
        <div className="product-hero__actions">
          <Link to={productHref} className="product-hero__cta">
            {slide.ctaLabel || 'Shop now'}
          </Link>
          {slide.product && (
            <div className="product-hero__price">
              <span>Deal price</span>
              <strong>{getProductPrice(slide.product)}</strong>
            </div>
          )}
        </div>
      </div>

      <Link to={productHref} className="product-hero__media" aria-label={`View ${slide.title}`}>
        {image ? (
          <img src={image} alt={slide.title} />
        ) : (
          <div className="product-hero__placeholder">KC</div>
        )}
      </Link>

      {slides.length > 1 && (
        <>
          <div className="product-hero__nav">
            <button type="button" onClick={() => move(-1)} aria-label="Previous banner">
              <FaArrowLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next banner">
              <FaArrowRight aria-hidden="true" />
            </button>
          </div>

          <div className="product-hero__dots" aria-label="Banner slides">
            {slides.map((item, index) => (
              <button
                key={item._id || index}
                type="button"
                className={index === active ? 'is-active' : ''}
                onClick={() => setActive(index)}
                aria-label={`Show banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
