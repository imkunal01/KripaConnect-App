import './SkeletonLoader.css'

/* =========================================================
   Blinkit-Style Compact Product Card Skeleton
   Matches the 126px-160px / 3-column mobile & multi-column desktop cards
   ========================================================= */
export function ProductCardSkeleton() {
  return (
    <div className="bk-sk-product-card">
      {/* Top row: discount tag + wishlist icon */}
      <div className="bk-sk-top-row">
        <div className="kc-skeleton-base bk-sk-discount-pill" />
        <div className="kc-skeleton-base bk-sk-fav-circle" />
      </div>

      {/* Image Stage */}
      <div className="bk-sk-img-stage">
        <div className="kc-skeleton-base bk-sk-img" />
        <div className="kc-skeleton-base bk-sk-time-pill" />
      </div>

      {/* Card Body */}
      <div className="bk-sk-body">
        <div className="bk-sk-meta-row">
          <div className="kc-skeleton-base bk-sk-weight" />
          <div className="kc-skeleton-base bk-sk-rating" />
        </div>

        <div className="kc-skeleton-base bk-sk-title" />
        <div className="kc-skeleton-base bk-sk-title-short" />

        {/* Bottom row: Price + Circular / Pill Add Button */}
        <div className="bk-sk-bottom-row">
          <div className="bk-sk-pricing">
            <div className="kc-skeleton-base bk-sk-price" />
            <div className="kc-skeleton-base bk-sk-mrp" />
          </div>
          <div className="kc-skeleton-base bk-sk-add-btn" />
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Blinkit-Style Product Grid Skeleton (3 cols mobile / 4-5 cols desk)
   ========================================================= */
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="bk-sk-product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* =========================================================
   Blinkit-Style Category Card Skeleton (Filter Strip / Matrix)
   ========================================================= */
export function CategoryCardSkeleton() {
  return (
    <div className="bk-sk-cat-card">
      <div className="kc-skeleton-base bk-sk-cat-icon" />
      <div className="kc-skeleton-base bk-sk-cat-name" />
    </div>
  )
}

export function CategoryGridSkeleton({ count = 8 }) {
  return (
    <div className="bk-sk-cat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* =========================================================
   Blinkit-Style Orders List Skeleton
   ========================================================= */
export function OrderCardSkeleton() {
  return (
    <div className="bk-sk-order-card">
      <div className="bk-sk-order-header">
        <div className="kc-skeleton-base bk-sk-order-id" />
        <div className="kc-skeleton-base bk-sk-order-status" />
      </div>
      <div className="bk-sk-order-body">
        <div className="kc-skeleton-base bk-sk-order-thumb" />
        <div className="bk-sk-order-details">
          <div className="kc-skeleton-base bk-sk-order-title" />
          <div className="kc-skeleton-base bk-sk-order-sub" />
          <div className="kc-skeleton-base bk-sk-order-price" />
        </div>
      </div>
    </div>
  )
}

export function OrdersListSkeleton({ count = 4 }) {
  return (
    <div className="bk-sk-orders-list">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* =========================================================
   Blinkit-Style Order Details Skeleton
   ========================================================= */
export function OrderDetailsSkeleton() {
  return (
    <div className="bk-sk-order-details-stage">
      <div className="bk-sk-details-top">
        <div className="kc-skeleton-base bk-sk-details-id" />
        <div className="kc-skeleton-base bk-sk-details-status" />
      </div>
      <div className="kc-skeleton-base bk-sk-timeline" />
      <div className="bk-sk-details-grid">
        <div className="bk-sk-details-card">
          <div className="kc-skeleton-base bk-sk-title" style={{ width: '40%' }} />
          <div className="kc-skeleton-base bk-sk-title-short" style={{ width: '80%' }} />
        </div>
        <div className="bk-sk-details-card">
          <div className="kc-skeleton-base bk-sk-price" style={{ width: '60%' }} />
          <div className="kc-skeleton-base bk-sk-add-btn" style={{ width: '100%', height: '40px' }} />
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Blinkit-Style Product Details (PDP) Skeleton
   ========================================================= */
export function ProductDetailsSkeleton() {
  return (
    <div className="bk-sk-pdp-stage">
      <div className="bk-sk-pdp-gallery">
        <div className="kc-skeleton-base bk-sk-pdp-img" />
        <div className="bk-sk-pdp-thumbs">
          <div className="kc-skeleton-base bk-sk-pdp-thumb" />
          <div className="kc-skeleton-base bk-sk-pdp-thumb" />
          <div className="kc-skeleton-base bk-sk-pdp-thumb" />
        </div>
      </div>
      <div className="bk-sk-pdp-info">
        <div className="kc-skeleton-base bk-sk-time-pill" style={{ width: '90px', height: '22px' }} />
        <div className="kc-skeleton-base bk-sk-pdp-title" />
        <div className="kc-skeleton-base bk-sk-pdp-price" />
        <div className="kc-skeleton-base bk-sk-pdp-box" />
        <div className="kc-skeleton-base bk-sk-pdp-cta" />
      </div>
    </div>
  )
}

/* =========================================================
   Admin Stat & Table Skeletons
   ========================================================= */
export function AdminStatsSkeleton({ count = 4 }) {
  return (
    <div className="admin-stats-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-stat-card-skeleton">
          <div className="kc-skeleton-base sk-stat-title" />
          <div className="kc-skeleton-base sk-stat-val" />
        </div>
      ))}
    </div>
  )
}

export function AdminTableSkeleton({ rows = 6 }) {
  return (
    <div className="admin-table-skeleton">
      <div className="kc-skeleton-base sk-table-header" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="kc-skeleton-base sk-table-row" />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return <div className="kc-skeleton-base hero-skeleton" />
}

export function PageSkeleton() {
  return (
    <div style={{ padding: '20px 16px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div className="kc-skeleton-base" style={{ height: '32px', width: '220px', marginBottom: '18px' }} />
      <ProductGridSkeleton count={6} />
    </div>
  )
}
