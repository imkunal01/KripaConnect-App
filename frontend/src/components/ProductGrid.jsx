import { useContext } from 'react'
import ShopContext from '../context/ShopContext.jsx'
import ProductCard from './ProductCard.jsx'
import './ProductGrid.css'

export default function ProductGrid({ items }) {
  const { favorites } = useContext(ShopContext)
  return (
    <div className="product-grid">
      {items.map(p => (
        <ProductCard key={p._id} product={p} favorite={favorites.includes(p._id)} />
      ))}
    </div>
  )
}

