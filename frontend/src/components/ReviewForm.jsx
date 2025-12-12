import { useContext, useState } from 'react'
import AuthContext from '../context/AuthContext.jsx'

export default function ReviewForm({ onSubmit }) {
  const { token } = useContext(AuthContext)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!token) return
    if (!rating || rating < 1 || rating > 5) return
    if (!text || text.trim().length < 3) return
    setLoading(true)
    try {
      await onSubmit({ rating, text: text.trim() })
      setText('')
      setRating(5)
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <select value={rating} onChange={e => setRating(Number(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your review" rows={3} />
      <button className="nav-btn signup-btn" disabled={loading || !token} type="submit">Submit Review</button>
    </form>
  )
}

