import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAllReviews, deleteReview } from '../../services/admin'
import { FiStar, FiTrash2, FiMessageSquare, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function StarRating({ rating }) {
  return (
    <div className="adminStars" style={{ display: 'flex', gap: 3 }} aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <FiStar
          key={star}
          style={{
            fontSize: '1rem',
            fill: star <= rating ? '#f59e0b' : 'transparent',
            color: star <= rating ? '#f59e0b' : '#cbd5e1'
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function ReviewModeration() {
  const { token } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadReviews()
  }, [token])

  async function loadReviews() {
    try {
      setLoading(true)
      const data = await getAllReviews(token)
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(reviewId) {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await deleteReview(reviewId, token)
      setReviews(prev => prev.filter(r => r._id !== reviewId))
      toast.success('Review deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete review')
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (filter === 'low' && review.rating >= 3) return false
    if (filter === 'high' && review.rating < 4) return false
    return true
  })

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Review Moderation</h1>
          <p className="adminPageHeader__subtitle">Manage customer reviews and feedback quality</p>
        </div>
        <button
          type="button"
          className="adminShortcutBtn"
          onClick={loadReviews}
          title="Refresh Reviews"
        >
          <FiRefreshCw className={loading ? 'adminSpin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="adminStatusPills">
            <button
              type="button"
              className={`adminStatusPill ${filter === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span>All Reviews ({reviews.length})</span>
            </button>
            <button
              type="button"
              className={`adminStatusPill ${filter === 'high' ? 'is-active' : ''}`}
              onClick={() => setFilter('high')}
            >
              <FiStar style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              <span>High Rating (4-5)</span>
            </button>
            <button
              type="button"
              className={`adminStatusPill ${filter === 'low' ? 'is-active' : ''}`}
              onClick={() => setFilter('low')}
            >
              <FiStar style={{ color: '#ef4444' }} />
              <span>Low Rating (1-3)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="adminGrid" style={{ gap: 14 }}>
        {loading ? (
          <div className="adminEmpty">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="adminCard" style={{ padding: '36px 16px', textAlign: 'center' }}>
            <FiMessageSquare style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: 8 }} />
            <div style={{ fontWeight: 800, color: '#334155' }}>No reviews found</div>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review._id} className="adminCard" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {review.user?.profilePhoto ? (
                      <img className="adminAvatar" src={review.user.profilePhoto} alt={review.user.name} />
                    ) : (
                      <div className="adminAvatarFallback">{review.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{review.user?.name || 'Anonymous Buyer'}</div>
                      <div className="adminHelp" style={{ fontSize: '0.74rem' }}>{formatDate(review.createdAt)}</div>
                    </div>
                  </div>

                  {review.product && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', marginBottom: 8, fontSize: '0.8rem' }}>
                      <span className="adminHelp">Product: </span>
                      <strong style={{ color: '#0f172a' }}>{review.product.name}</strong>
                    </div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <StarRating rating={review.rating} />
                  </div>

                  <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {review.text}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="adminBtn adminBtnDanger adminBtn--sm"
                    onClick={() => handleDelete(review._id)}
                    title="Delete Review"
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
