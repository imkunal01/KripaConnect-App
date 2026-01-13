import { useCallback, useRef, useState } from 'react'

/**
 * Native-like button press feedback hook
 * Provides instant visual feedback (<50ms) before any async operations
 * 
 * Usage:
 * const pressProps = useNativePress()
 * <button {...pressProps}>Click me</button>
 * 
 * Or with onClick:
 * const pressProps = useNativePress(handleClick)
 * <button {...pressProps}>Click me</button>
 */
export function useNativePress(onClick) {
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    setIsPressed(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleTouchEnd = useCallback((e) => {
    timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // Only left click
    setIsPressed(true)
  }, [])

  const handleMouseUp = useCallback((e) => {
    timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
  }, [])

  const handleMouseLeave = useCallback((e) => {
    timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
  }, [])

  const handleClick = useCallback((e) => {
    if (onClick) {
      onClick(e)
    }
  }, [onClick])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    style: {
      transform: isPressed ? 'scale(0.96)' : 'scale(1)',
      opacity: isPressed ? 0.8 : 1,
      transition: 'transform 0.05s ease-out, opacity 0.05s ease-out',
      willChange: 'transform, opacity',
    },
  }
}

/**
 * Get only the press state for custom implementations
 */
export function usePressState() {
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef(null)

  const handlers = {
    onTouchStart: () => {
      setIsPressed(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    onTouchEnd: () => {
      timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
    },
    onMouseDown: (e) => {
      if (e.button !== 0) return
      setIsPressed(true)
    },
    onMouseUp: () => {
      timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
    },
    onMouseLeave: () => {
      timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
    },
  }

  return [isPressed, handlers]
}
