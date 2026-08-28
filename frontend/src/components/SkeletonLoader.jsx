import './SkeletonLoader.css'

export function ProductCardSkeleton() {
  return (
    <div className="product-card-skeleton">
      <div className="kc-skeleton-base sk-img" />
      <div className="kc-skeleton-base sk-badge" />
      <div className="kc-skeleton-base sk-title" />
      <div className="kc-skeleton-base sk-title-sub" />
      <div className="kc-skeleton-base sk-price" />
      <div className="kc-skeleton-base sk-btn" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="category-card-skeleton">
      <div className="kc-skeleton-base sk-cat-icon" />
      <div className="kc-skeleton-base sk-cat-name" />
    </div>
  )
}

export function CategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="category-grid-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="order-card-skeleton">
      <div className="order-card-sk-header">
        <div className="kc-skeleton-base sk-order-id" />
        <div className="kc-skeleton-base sk-order-status" />
      </div>
      <div className="order-card-sk-body">
        <div className="kc-skeleton-base sk-item-thumb" />
        <div className="sk-item-details">
          <div className="kc-skeleton-base sk-title" />
          <div className="kc-skeleton-base sk-title-sub" />
        </div>
      </div>
    </div>
  )
}

export function OrdersListSkeleton({ count = 4 }) {
  return (
    <div className="orders-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderDetailsSkeleton() {
  return (
    <div className="order-details-skeleton">
      <div className="sk-details-header">
        <div className="kc-skeleton-base sk-order-id" style={{ width: '220px', height: '28px' }} />
        <div className="kc-skeleton-base sk-order-status" style={{ width: '100px', height: '32px' }} />
      </div>
      <div className="kc-skeleton-base sk-timeline" />
      <div className="sk-details-grid">
        <div className="sk-details-card">
          <div className="kc-skeleton-base sk-title" style={{ width: '40%' }} />
          <div className="kc-skeleton-base sk-title-sub" style={{ width: '90%' }} />
          <div className="kc-skeleton-base sk-title-sub" style={{ width: '70%' }} />
        </div>
        <div className="sk-details-card">
          <div className="kc-skeleton-base sk-title" style={{ width: '60%' }} />
          <div className="kc-skeleton-base sk-price" style={{ width: '80%' }} />
          <div className="kc-skeleton-base sk-btn" style={{ height: '44px' }} />
        </div>
      </div>
    </div>
  )
}

export function ProductDetailsSkeleton() {
  return (
    <div className="product-details-skeleton">
      <div className="sk-gallery">
        <div className="kc-skeleton-base sk-gallery-main" />
        <div className="sk-gallery-thumbs">
          <div className="kc-skeleton-base sk-thumb" />
          <div className="kc-skeleton-base sk-thumb" />
          <div className="kc-skeleton-base sk-thumb" />
        </div>
      </div>
      <div className="sk-info">
        <div className="kc-skeleton-base sk-badge" style={{ width: '25%', height: '20px' }} />
        <div className="kc-skeleton-base sk-title" style={{ width: '80%', height: '32px' }} />
        <div className="kc-skeleton-base sk-price" style={{ width: '40%', height: '36px' }} />
        <div className="kc-skeleton-base sk-title-sub" style={{ width: '100%', height: '80px', borderRadius: '10px' }} />
        <div className="kc-skeleton-base sk-btn" style={{ width: '60%', height: '48px', marginTop: '20px' }} />
      </div>
    </div>
  )
}

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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="kc-skeleton-base" style={{ height: '36px', width: '240px', marginBottom: '24px' }} />
      <div className="kc-skeleton-base" style={{ height: '250px', width: '100%', borderRadius: '12px' }} />
    </div>
  )
}
