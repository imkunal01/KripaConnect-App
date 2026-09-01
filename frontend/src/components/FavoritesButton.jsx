import { useContext, useState } from 'react'
import { FaHeart } from 'react-icons/fa'
import { FiHeart } from 'react-icons/fi'
import ShopContext from '../context/ShopContext.jsx'
import { usePreventRageTap } from '../hooks/usePreventRageTap.js'
import './FavoritesButton.css'

export default function FavoritesButton({ productId, active }) {
  const { toggleFavorite } = useContext(ShopContext)
  const [anim, setAnim] = useState(false)
  const [isProcessing, withPrevent] = usePreventRageTap({ minDelay: 200 })

  const handleClick = withPrevent(async () => {
    setAnim(true)
    await toggleFavorite(productId)
    setTimeout(() => setAnim(false), 300)
  })

  return (
    <button
      className={`wish-btn ${active ? "wish-active" : ""} ${anim ? "wish-pop" : ""}`}
      onClick={handleClick}
      disabled={isProcessing}
      type="button"
      aria-label={active ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <span className="wish-icon">
        {active ? <FaHeart style={{ color: '#FF3D3D' }} /> : <FiHeart />}
      </span>

      <span className="wish-text">
        {active ? "Added to Wishlist" : "Add to Wishlist"}
      </span>
    </button>
  )
}
