import { useContext } from 'react'
import ShopContext from '../context/ShopContext.jsx'

export default function FavoritesButton({ productId, active }) {
  const { toggleFavorite } = useContext(ShopContext)
  return (
    <button className="nav-btn" onClick={() => toggleFavorite(productId)}>{active ? '★' : '☆'} Favorite</button>
  )
}

