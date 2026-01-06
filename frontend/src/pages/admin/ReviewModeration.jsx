import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAllReviews, deleteReview } from '../../services/admin'

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
    <div className="adminStars" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`adminStar ${star <= rating ? 'isFilled' : ''}`} aria-hidden="true">
          ★
        </span>
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
      setReviews(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(reviewId) {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        await deleteReview(reviewId, token)
        await loadReviews()
      } catch (err) {
        alert(err.message || 'Failed to delete review')
      }
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (filter === 'low' && review.rating >= 3) return false
    if (filter === 'high' && review.rating < 4) return false
    return true
  })

  if (loading) return <div className="adminEmpty">Loading…</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Review Moderation</h1>
          <p className="adminPageHeader__subtitle">Manage product reviews and maintain content quality</p>
        </div>
      </div>

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section" style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240 }}>
            <label className="adminLabel">Filter</label>
            <select
              className="adminSelect"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Reviews</option>
              <option value="high">High Rating (4–5)</option>
              <option value="low">Low Rating (1–3)</option>
            </select>
          </div>
          <div className="adminHelp" style={{ marginLeft: 'auto' }}>
            Total: {filteredReviews.length} reviews
          </div>
        </div>
      </div>

      <div className="adminGrid" style={{ gap: 16 }}>
        {filteredReviews.length === 0 ? (
          <div className="adminCard">
            <div className="adminEmpty">No reviews found</div>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review._id} className="adminCard">
              <div className="adminCard__section" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    {review.user?.profilePhoto ? (
                      <img className="adminAvatar" src={review.user.profilePhoto} alt={review.user.name} />
                    ) : (
                      <div className="adminAvatarFallback">{review.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 900 }}>{review.user?.name || 'Anonymous'}</div>
                      <div className="adminHelp">{formatDate(review.createdAt)}</div>
                    </div>
                  </div>

                  {review.product && (
                    <div className="adminCard" style={{ boxShadow: 'none', marginBottom: 10 }}>
                      <div className="adminCard__section" style={{ padding: 12 }}>
                        <div className="adminHelp" style={{ marginBottom: 4 }}>Product</div>
                        <div style={{ fontWeight: 900 }}>{review.product.name}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    <StarRating rating={review.rating} />
                  </div>

                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.65 }}>
                    {review.text}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="adminBtn adminBtnDanger adminBtn--sm"
                    onClick={() => handleDelete(review._id)}
                  >
                    Delete
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

