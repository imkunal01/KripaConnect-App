import { useState, useCallback, useRef } from 'react'

/**
 * Prevent rage taps - disable button after click until action completes
 * 
 * Usage:
 * const [isProcessing, withPrevent] = usePreventRageTap()
 * 
 * <button disabled={isProcessing} onClick={withPrevent(async () => {
 *   await addToCart(product)
 * })}>
 *   {isProcessing ? 'Adding...' : 'Add to Cart'}
 * </button>
 */
export function usePreventRageTap(options = {}) {
  const { minDelay = 300 } = options
  const [isProcessing, setIsProcessing] = useState(false)
  const timeoutRef = useRef(null)

  const withPrevent = useCallback((asyncFn) => {
    return async (...args) => {
      if (isProcessing) return // Already processing
      
      setIsProcessing(true)
      const startTime = Date.now()

      try {
        await asyncFn(...args)
      } finally {
        // Ensure minimum delay for visual feedback
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, minDelay - elapsed)
        
        if (remaining > 0) {
          timeoutRef.current = setTimeout(() => {
            setIsProcessing(false)
          }, remaining)
        } else {
          setIsProcessing(false)
        }
      }
    }
  }, [isProcessing, minDelay])

  return [isProcessing, withPrevent]
}

/**
 * State helper for button text during processing
 * 
 * Usage:
 * const [state, setState] = useButtonState('Add to Cart')
 * 
 * setState('adding') -> 'Adding...'
 * setState('success') -> 'Added ✓'
 * setState('error') -> 'Failed ✗'
 */
export function useButtonState(defaultText = 'Submit') {
  const [state, setState] = useState('idle')
  const timeoutRef = useRef(null)

  const setButtonState = useCallback((newState) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    setState(newState)

    // Auto-reset success/error states after 2s
    if (newState === 'success' || newState === 'error') {
      timeoutRef.current = setTimeout(() => {
        setState('idle')
      }, 2000)
    }
  }, [])

  const buttonText = {
    idle: defaultText,
    loading: `${defaultText.replace(/^(Add|Remove|Update|Delete|Save|Submit)/i, '$1ing')}...`,
    success: `${defaultText.split(' ')[0]}ed ✓`,
    error: 'Failed ✗'
  }[state] || defaultText

  return [buttonText, setButtonState, state]
}
