import React, { useMemo } from 'react'
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'
import './Pagination.css'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 24,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  showPageSize = false,
  showTotal = true,
  showFirstLast = false,
  itemLabel = 'products',
  className = '',
}) {
  const page = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)))

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [1]

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages = []

    if (page <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis-right', totalPages)
    } else if (page >= totalPages - 2) {
      pages.push(1, 'ellipsis-left', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, 'ellipsis-left', page - 1, page, page + 1, 'ellipsis-right', totalPages)
    }

    return pages
  }, [page, totalPages])

  if (totalPages <= 1 && totalItems <= pageSize && !showPageSize) {
    return null
  }

  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0
  const endItem = totalItems > 0 ? Math.min(page * pageSize, totalItems) : 0

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p !== page && p >= 1 && p <= totalPages) {
      onPageChange(p)
    }
  }

  return (
    <nav
      className={`kc-pagination-container ${className}`}
      role="navigation"
      aria-label="Pagination Navigation"
    >
      {/* Information Summary */}
      {showTotal && totalItems > 0 && (
        <div className="kc-pagination__info">
          <span>Showing </span>
          <strong className="kc-pagination__highlight">{startItem}</strong>
          <span>–</span>
          <strong className="kc-pagination__highlight">{endItem}</strong>
          <span> of </span>
          <strong className="kc-pagination__highlight">{totalItems.toLocaleString('en-IN')}</strong>
          <span> {itemLabel}</span>
        </div>
      )}

      {/* Main Pagination Buttons */}
      <div className="kc-pagination__controls">
        {/* First Page Button */}
        {showFirstLast && totalPages > 4 && (
          <button
            type="button"
            className="kc-pagination__btn kc-pagination__nav-btn"
            onClick={() => handlePageClick(1)}
            disabled={page <= 1}
            aria-label="First page"
            title="First page"
          >
            <FaAngleDoubleLeft aria-hidden="true" />
          </button>
        )}

        {/* Previous Page Button */}
        <button
          type="button"
          className="kc-pagination__btn kc-pagination__nav-btn"
          onClick={() => handlePageClick(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          title="Previous page"
        >
          <FaChevronLeft aria-hidden="true" />
          <span className="kc-pagination__nav-label">Prev</span>
        </button>

        {/* Number Buttons */}
        <div className="kc-pagination__pages" role="list">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="kc-pagination__ellipsis"
                  aria-hidden="true"
                >
                  …
                </span>
              )
            }

            const isActive = p === page
            return (
              <button
                key={p}
                type="button"
                className={`kc-pagination__btn kc-pagination__page-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => handlePageClick(p)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          className="kc-pagination__btn kc-pagination__nav-btn"
          onClick={() => handlePageClick(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          title="Next page"
        >
          <span className="kc-pagination__nav-label">Next</span>
          <FaChevronRight aria-hidden="true" />
        </button>

        {/* Last Page Button */}
        {showFirstLast && totalPages > 4 && (
          <button
            type="button"
            className="kc-pagination__btn kc-pagination__nav-btn"
            onClick={() => handlePageClick(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
            title="Last page"
          >
            <FaAngleDoubleRight aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <div className="kc-pagination__size-selector">
          <label htmlFor="kc-page-size-select" className="kc-pagination__size-label">
            Per page:
          </label>
          <select
            id="kc-page-size-select"
            className="kc-pagination__select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  )
}
