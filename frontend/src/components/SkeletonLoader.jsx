import './SkeletonLoader.css'

export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="skeleton-body">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-tag"></div>
        <div className="skeleton skeleton-price"></div>
      </div>
      <div className="skeleton skeleton-button"></div>
    </div>
  )
}

export function ProductListSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  )
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton">
      <div className="skeleton skeleton-header"></div>
      <div className="skeleton skeleton-content"></div>
    </div>
  )
}
