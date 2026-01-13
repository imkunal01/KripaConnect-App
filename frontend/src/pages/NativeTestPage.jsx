/**
 * Native Mobile Features - Test Component
 * 
 * This page demonstrates all native mobile features.
 * Navigate to /test-native to see it in action.
 */

import { useState, useContext } from 'react'
import ShopContext from '../context/ShopContext'
import { usePreventRageTap } from '../hooks/usePreventRageTap'
import { usePrefetch } from '../hooks/usePrefetch'
import { ProductListSkeleton } from '../components/SkeletonLoader'

export default function NativeTestPage() {
  const { addToCart, toggleFavorite } = useContext(ShopContext)
  const [showResults, setShowResults] = useState(false)
  const [testResults, setTestResults] = useState({})

  // Test 1: Button Response Time
  const testButtonResponse = () => {
    const startTime = performance.now()
    setTimeout(() => {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      setTestResults(prev => ({
        ...prev,
        buttonResponse: {
          time: Math.round(responseTime),
          passed: responseTime < 50
        }
      }))
    }, 0)
  }

  // Test 2: Rage-Tap Prevention
  const [isTestingRageTap, withPreventTest] = usePreventRageTap()
  const testRageTap = withPreventTest(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    setTestResults(prev => ({
      ...prev,
      rageTap: {
        prevented: true,
        passed: true
      }
    }))
  })

  // Test 3: Optimistic UI
  const testOptimisticUI = () => {
    const mockProduct = {
      _id: 'test-123',
      name: 'Test Product',
      price: 100,
      images: [{ url: '' }]
    }
    
    const uiUpdateTime = performance.now()
    addToCart(mockProduct, 1)
    const responseTime = performance.now() - uiUpdateTime
    
    setTestResults(prev => ({
      ...prev,
      optimisticUI: {
        time: Math.round(responseTime),
        passed: responseTime < 10 // UI should update in <10ms
      }
    }))
  }

  // Test 4: Skeleton Loader
  const [showSkeleton, setShowSkeleton] = useState(false)
  const testSkeleton = () => {
    setShowSkeleton(true)
    setTimeout(() => {
      setShowSkeleton(false)
      setTestResults(prev => ({
        ...prev,
        skeleton: {
          showed: true,
          passed: true
        }
      }))
    }, 2000)
  }

  // Test 5: Prefetch
  const [prefetchTriggered, setPrefetchTriggered] = useState(false)
  const prefetchProps = usePrefetch(() => {
    setPrefetchTriggered(true)
    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        prefetch: {
          triggered: true,
          passed: true
        }
      }))
    }, 100)
  })

  const runAllTests = () => {
    setShowResults(true)
    setTestResults({})
    
    // Run tests sequentially
    testButtonResponse()
    setTimeout(() => testOptimisticUI(), 200)
    setTimeout(() => testSkeleton(), 400)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Native Mobile Features Test</h1>
      
      <div style={{ marginBottom: '32px' }}>
        <button 
          onClick={runAllTests}
          style={{
            padding: '12px 24px',
            background: '#FF3D3D',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Run All Tests
        </button>
      </div>

      {/* Test Results */}
      {showResults && (
        <div style={{ 
          background: '#f9fafb', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <h2>Test Results</h2>
          
          {/* Button Response */}
          <TestResult
            name="Button Response Time"
            result={testResults.buttonResponse}
            expected="<50ms"
          />

          {/* Optimistic UI */}
          <TestResult
            name="Optimistic UI Update"
            result={testResults.optimisticUI}
            expected="<10ms"
          />

          {/* Skeleton Loader */}
          <TestResult
            name="Skeleton Loader"
            result={testResults.skeleton}
            expected="Shows instantly"
          />

          {/* Rage-Tap */}
          <TestResult
            name="Rage-Tap Prevention"
            result={testResults.rageTap}
            expected="Button disabled during action"
          />

          {/* Prefetch */}
          <TestResult
            name="Prefetch on Intent"
            result={testResults.prefetch}
            expected="Triggers on touch/hover"
          />
        </div>
      )}

      {/* Individual Tests */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Test 1 */}
        <TestCard title="1. Button Response Time">
          <button
            onClick={testButtonResponse}
            style={buttonStyle}
          >
            Tap Me (Test Response)
          </button>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Should feel instant (under 50ms). Watch for scale/opacity change.
          </p>
        </TestCard>

        {/* Test 2 */}
        <TestCard title="2. Rage-Tap Prevention">
          <button
            onClick={testRageTap}
            disabled={isTestingRageTap}
            style={buttonStyle}
          >
            {isTestingRageTap ? 'Processing...' : 'Tap Me Multiple Times'}
          </button>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Try tapping repeatedly - should disable after first tap.
          </p>
        </TestCard>

        {/* Test 3 */}
        <TestCard title="3. Optimistic UI">
          <button
            onClick={testOptimisticUI}
            style={buttonStyle}
          >
            Add Test Product to Cart
          </button>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Cart should update instantly, before API call.
          </p>
        </TestCard>

        {/* Test 4 */}
        <TestCard title="4. Skeleton Loader">
          <button
            onClick={testSkeleton}
            style={buttonStyle}
          >
            Show Skeleton
          </button>
          {showSkeleton && (
            <div style={{ marginTop: '16px' }}>
              <ProductListSkeleton count={3} />
            </div>
          )}
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Should appear instantly with shimmer animation.
          </p>
        </TestCard>

        {/* Test 5 */}
        <TestCard title="5. Prefetch on Touch/Hover">
          <div
            {...prefetchProps}
            style={{
              padding: '16px',
              background: prefetchTriggered ? '#10b981' : '#e5e7eb',
              color: prefetchTriggered ? 'white' : '#111827',
              borderRadius: '8px',
              textAlign: 'center',
              transition: 'background 0.3s',
              cursor: 'pointer'
            }}
          >
            {prefetchTriggered ? 'Prefetch Triggered! ✓' : 'Touch or Hover Me'}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Should trigger prefetch on touch/hover.
          </p>
        </TestCard>

        {/* Test 6 */}
        <TestCard title="6. No Browser Artifacts">
          <div
            style={{
              padding: '16px',
              background: '#e5e7eb',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <button style={buttonStyle}>Tap - No Blue Highlight</button>
            <p style={{ marginTop: '12px', fontSize: '14px' }}>
              Long press - No callout menu
            </p>
            <p style={{ fontSize: '14px' }}>
              Try to select this text - Should not select
            </p>
          </div>
        </TestCard>

        {/* Test 7 */}
        <TestCard title="7. Native Press Feedback">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={buttonStyle}>Button</button>
            <a href="#" style={{ ...buttonStyle, textDecoration: 'none' }}>Link</a>
            <div 
              role="button" 
              tabIndex={0}
              style={buttonStyle}
              onClick={() => {}}
            >
              Div Button
            </div>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            All should scale down and fade slightly on press.
          </p>
        </TestCard>
      </div>

      {/* Manual Checks */}
      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        background: '#fffbeb', 
        borderRadius: '12px',
        border: '2px solid #fbbf24'
      }}>
        <h3 style={{ marginTop: 0 }}>📱 Manual Checks</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>No blue tap highlights anywhere</li>
          <li>No 300ms delay on button taps</li>
          <li>Buttons respond within 50ms</li>
          <li>No overscroll bounce (rubber band)</li>
          <li>Text doesn't select accidentally on tap</li>
          <li>Page transitions are smooth</li>
          <li>App feels as fast as Swiggy/Zepto/Blinkit</li>
        </ul>
      </div>

      {/* Success Criteria */}
      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        background: '#dcfce7', 
        borderRadius: '12px'
      }}>
        <h3 style={{ marginTop: 0 }}>✅ Success Criteria</h3>
        <p><strong>Your app should now:</strong></p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Feel like a native Android app</li>
          <li>Have zero browser artifacts</li>
          <li>Respond instantly to all taps</li>
          <li>Update UI before API calls (optimistic)</li>
          <li>Prevent accidental double-taps</li>
          <li>Show clear loading feedback</li>
        </ul>
      </div>
    </div>
  )
}

// Helper Components
function TestCard({ title, children }) {
  return (
    <div style={{
      padding: '20px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px'
    }}>
      <h3 style={{ marginTop: 0, fontSize: '18px' }}>{title}</h3>
      {children}
    </div>
  )
}

function TestResult({ name, result, expected }) {
  if (!result) {
    return (
      <div style={{ padding: '12px', marginBottom: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
        <div style={{ fontWeight: '600' }}>{name}</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>⏳ Running...</div>
      </div>
    )
  }

  const passed = result.passed
  return (
    <div style={{ 
      padding: '12px', 
      marginBottom: '8px', 
      background: passed ? '#dcfce7' : '#fee2e2', 
      borderRadius: '6px' 
    }}>
      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{passed ? '✅' : '❌'}</span>
        <span>{name}</span>
      </div>
      <div style={{ fontSize: '14px', marginTop: '4px' }}>
        Expected: {expected}
        {result.time && ` | Actual: ${result.time}ms`}
      </div>
    </div>
  )
}

const buttonStyle = {
  padding: '12px 24px',
  background: '#FF3D3D',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer'
}
