import { useContext } from 'react'
import ShopContext from '../context/ShopContext.jsx'
import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ items }) {
  const { favorites } = useContext(ShopContext)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {items.map(p => (
        <ProductCard key={p._id} product={p} favorite={favorites.includes(p._id)} />
      ))}
    </div>
  )
}

