import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Prefetch route data on touch/hover intent
 * 
 * Usage:
 * const linkProps = usePrefetchRoute('/products', prefetchProductsData)
 * <Link {...linkProps}>Products</Link>
 */
export function usePrefetchRoute(to, prefetchFn) {
  const navigate = useNavigate()
  const prefetchedRef = useRef(false)
  const timeoutRef = useRef(null)

  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current || !prefetchFn) return
    prefetchedRef.current = true
    
    try {
      prefetchFn()
    } catch (err) {
      console.error('Prefetch failed:', err)
    }
  }, [prefetchFn])

  const handleTouchStart = useCallback(() => {
    // Prefetch immediately on touch
    handlePrefetch()
  }, [handlePrefetch])

  const handleMouseEnter = useCallback(() => {
    // Prefetch after 100ms hover (desktop)
    timeoutRef.current = setTimeout(handlePrefetch, 100)
  }, [handlePrefetch])

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleFocus = useCallback(() => {
    // Prefetch on keyboard navigation
    handlePrefetch()
  }, [handlePrefetch])

  return {
    to,
    onTouchStart: handleTouchStart,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
  }
}

/**
 * Simpler version - just add touch/hover prefetch to any element
 * 
 * Usage:
 * const prefetchProps = usePrefetch(() => fetchProducts())
 * <div {...prefetchProps}>...</div>
 */
export function usePrefetch(prefetchFn) {
  const prefetchedRef = useRef(false)
  const timeoutRef = useRef(null)

  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current || !prefetchFn) return
    prefetchedRef.current = true
    
    try {
      prefetchFn()
    } catch (err) {
      console.error('Prefetch failed:', err)
    }
  }, [prefetchFn])

  return {
    onTouchStart: handlePrefetch,
    onMouseEnter: () => {
      timeoutRef.current = setTimeout(handlePrefetch, 100)
    },
    onMouseLeave: () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    onFocus: handlePrefetch,
  }
}
