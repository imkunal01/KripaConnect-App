function getStatusInfo(status) {
  switch (status) {
    case 'pending':
      return { label: 'Order Placed', icon: '📦', color: '#FF3D3D', completed: true }
    case 'shipped':
      return { label: 'Shipped', icon: '🚚', color: '#8b5cf6', completed: true }
    case 'delivered':
      return { label: 'Delivered', icon: '✅', color: '#10b981', completed: true }
    case 'cancelled':
      return { label: 'Cancelled', icon: '❌', color: '#ef4444', completed: true }
    default:
      return { label: status, icon: '📦', color: '#9ca3af', completed: false }
  }
}

function getStatusSteps(currentStatus) {
  const allSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📦' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
  ]
  
  const currentIndex = allSteps.findIndex(s => s.key === currentStatus)
  
  return allSteps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex || currentStatus === 'cancelled',
    current: index === currentIndex && currentStatus !== 'cancelled'
  }))
}

export default function OrderTimeline({ status, orderDate }) {
  const steps = getStatusSteps(status || 'pending')
  const isCancelled = status === 'cancelled'

  return (
    <div style={{ padding: '20px 0' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
        Order Status
      </h3>
      <div style={{ position: 'relative' }}>
        {steps.map((step, index) => {
          const isCompleted = step.completed || isCancelled
          const isCurrent = step.current && !isCancelled
          const isLast = index === steps.length - 1

          return (
            <div key={step.key} style={{ position: 'relative', marginBottom: isLast ? 0 : '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted && !isCancelled ? step.current ? '#8b5cf6' : '#10b981' : isCancelled ? '#ef4444' : '#e5e7eb',
                    color: isCompleted ? '#fff' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '600',
                    zIndex: 2,
                    position: 'relative',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ marginLeft: '16px', flex: 1 }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: isCurrent ? '600' : isCompleted ? '500' : '400',
                      color: isCompleted ? '#111827' : '#9ca3af',
                      marginBottom: '4px'
                    }}
                  >
                    {step.label}
                  </div>
                  {step.current && !isCancelled && (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>In progress</div>
                  )}
                  {index === 0 && orderDate && (
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {new Date(orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: '24px',
                    top: '48px',
                    width: '2px',
                    height: '30px',
                    backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                    zIndex: 1
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {isCancelled && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b'
          }}
        >
          <strong>Order Cancelled</strong>
        </div>
      )}
    </div>
  )
}

